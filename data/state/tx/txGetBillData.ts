/**
 * texas is a bit of a disaster.
 * We run this script with the following steps:
 * - download or update (incremental mode) the cache from the Texas FTP server
 * - download all of the legislative journals as HTML files from the journal sites
 * - scan the bill files for anything that mentions a record vote
 * - look up the journal of the corresponding date
 * - do some hopefully (but not likely) simple text parsing and searching to find the recorded vote
 *
 * extra credit: if there are unanimous consent bills maybe we can find that one
 *
 * cli use
 * npx tsx ./txGetBillData.ts [session number] [-i -v]
 * [session number, 2025 is 89]
 * [i = incremental mode]
 * [v = verbose mode (not recommended)]
 */
import { Client } from 'basic-ftp'
import { TxExitCode } from './TxExitCodes'
import fs from 'fs-extra'
import { parse } from 'node-html-parser'
import { Glob, glob } from 'glob'
import { XMLParser } from 'fast-xml-parser'
import type { LegislatureAction } from '../state-types'
import { toZonedTime } from 'date-fns-tz'

// initial cli config
const sessionNumber = parseInt(process.argv[2])
const incremental = process.argv.includes('-i')
const verbose = process.argv.includes('-v')

// file paths
const ftpCache = `./cache/${sessionNumber}/ftp`
fs.ensureDirSync(ftpCache)

/**
 * step 1: download the updated XML files
 * @returns Session identifiers. needed to fetch the journal data
 */
async function syncFtp() {
  // top level async baybeee we're livin in the future
  const ftp = new Client()

  try {
    ftp.ftp.verbose = verbose

    await ftp.access({
      host: 'ftp.legis.state.tx.us',
      secure: false,
    })

    // list out the session folders
    await ftp.cd('./bills')
    const dirs = await ftp.list()
    const relevant = dirs.filter((d) => d.name.startsWith(`${sessionNumber}`))
    const sessionIdentifiers = relevant.map((d) => d.name)

    for (const dir of relevant) {
      await ftp.cd(`/bills/${dir.name}/billhistory`)
      fs.ensureDirSync(`${ftpCache}/${dir.name}`)

      if (incremental) {
        // check the history files
        await ftp.downloadTo(
          `${ftpCache}/${dir.name}/history.xml`,
          './history.xml'
        )

        // parse the history file

        // fetch every file the history file mentions
      } else {
        // download everything
        await ftp.downloadToDir(`${ftpCache}/${dir.name}`)
      }
    }

    ftp.close()
    return sessionIdentifiers
  } catch (e) {
    console.error(`[ERROR] FTP sync failure. ${e}`)
    process.exitCode = TxExitCode.FTP_FAILURE

    ftp.close()
    return []
  }
}

/**
 * step 2: download the journal files
 */
async function syncJournals(sessionIdentifiers: string[]) {
  for (const sid of sessionIdentifiers) {
    try {
      fs.ensureDirSync(`./cache/${sessionNumber}/journals/senate`)

      // senate: https://journals.senate.texas.gov/sjrnl/[code]/html/
      // they're running a jquery table formatter on these endpoints
      // https://journals.senate.texas.gov/sjrnl/${sid}/html/data/jrnlData.txt?_search=false&rows=-1&page=1&sidx=lday&sord=asc
      const senateIndex = await (
        await fetch(
          `https://journals.senate.texas.gov/sjrnl/${sid}/html/data/jrnlData.txt?_search=false&rows=-1&page=1&sidx=lday&sord=asc`
        )
      ).json()

      // get all the links to journal pages
      // we want to save these by date, not by internal id
      const senateLinks = senateIndex.rows.map(
        (r: { id: string; cell: string[] }) => {
          // cell format is display date, date, category, session number, pages, link
          const date = r.cell[1]

          // second link is the html file
          const link = parse(r.cell[5])
            .querySelectorAll('a')[1]
            .getAttribute('href')

          return {
            date,
            id: r.id,
            link: `https://journals.senate.texas.gov${link}`,
          }
        }
      )

      // get all of the linked pages if they aren't already on disk
      for (const link of senateLinks) {
        // prefix with date, that's what we'll be indexing off of for vote lookup
        const filename = `${link.date}-${link.id}`
        const localFile = `./cache/${sessionNumber}/journals/senate/${filename}.htm`

        if (!fs.existsSync(localFile)) {
          // download
          console.log(`[JOURNAL] Caching ${localFile} from ${link.link}`)

          const text = await (await fetch(link.link)).text()

          // save
          fs.writeFileSync(localFile, text)
        }
      }

      // house: https://journals.house.texas.gov/hjrnl/[code]/html/
      // house is the same basically
      const houseIndex = await (
        await fetch(
          `https://journals.house.texas.gov/hjrnl/${sid}/html/data/jrnlData.txt?_search=false&rows=-1&page=1&sidx=lday&sord=asc`
        )
      ).json()

      // get all the links to journal pages
      // we want to save these by date, not by internal id
      const houseLinks = houseIndex.rows.map(
        (r: { id: string; cell: string[] }) => {
          // cell format is display date, date, category, session number, pages, link
          const date = r.cell[1]

          // second link is the html file
          const link = parse(r.cell[5])
            .querySelectorAll('a')[1]
            .getAttribute('href')

          return {
            date,
            id: r.id,
            link: `https://journals.house.texas.gov${link}`,
          }
        }
      )

      fs.ensureDirSync(`./cache/${sessionNumber}/journals/house`)

      // get all of the linked pages if they aren't already on disk
      for (const link of houseLinks) {
        // prefix with date, that's what we'll be indexing off of for vote lookup
        const filename = `${link.date}-${link.id}`
        const localFile = `./cache/${sessionNumber}/journals/house/${filename}.htm`

        if (!fs.existsSync(localFile)) {
          // download
          console.log(`[JOURNAL] Caching ${localFile} from ${link.link}`)

          const text = await (await fetch(link.link)).text()

          // save
          fs.writeFileSync(localFile, text)
        }
      }
    } catch (e) {
      console.log(e)
      process.exitCode = TxExitCode.JOURNAL_FAILURE

      // don't keep executing if we hit a failure
      return
    }
  }
}

/**
 * step 3: scan the bill files and write cache files for anything mentioning a "Record Vote" or "RV"
 */
function scanBillXml() {
  fs.ensureDirSync(`./cache/${sessionNumber}/actions`)

  // y'know what just glob the whole thing
  const parser = new XMLParser()
  const files = new Glob(`./cache/${sessionNumber}/ftp/**/*.xml`, {})
  for (const file of files) {
    if (file.endsWith('history.xml') || file.endsWith('history_periodic.xml')) {
      continue
    }

    try {
      // read the file and check for "record vote" in the actions
      const result = parser.parse(fs.readFileSync(file))

      // populate data if there's a relevant vote (don't write cache files for everything)
      const actions = result?.billhistory?.actions?.action

      if (actions && Array.isArray(actions)) {
        const votes = actions.filter(
          (a: Record<string, string>) =>
            a.description.toLowerCase() === 'record vote' || a.description.toLowerCase() === 'vote recorded in journal'
        )
        const isRelevant = votes.length > 0

        if (isRelevant) {
          console.log(`record vote found in ${file}`)

          // collect the action data
          // normalize the path
          const path = file.replaceAll('\\', '/')
          const fileParts = path.split('/')
          const partialId = fileParts[fileParts.length - 1].split('.')[0]
          const id = `TX-${fileParts[3]}-${partialId.replaceAll(' ', '')}`
          const action: LegislatureAction = {
            id,
            type: partialId.split(' ')[0],
            level: 'state',
            chamber: partialId.startsWith('S') ? 's' : 'h',
            introduced_at: actions[0].date,
            official_title: result.billhistory.caption,
            sponsor_id: 'TODO: author id',
            sponsor_type: 'person',
            status: result.billhistory.lastaction,
            status_at: result.billhistory.lastaction.split(' ')[0], // this should be a date
            tags: Array.isArray(result.billhistory.subjects.subject)
              ? result.billhistory.subjects.subject
              : [result.billhistory.subjects.subject],
            top_tag: Array.isArray(result.billhistory.subjects.subject)
              ? result.billhistory.subjects.subject[0]
              : result.billhistory.subjects.subject,
            cache_updated_at: new Date().toString(),
            source_url: `https://capitol.texas.gov/BillLookup/History.aspx?LegSess=${
              fileParts[3]
            }&Bill=${partialId.replaceAll(' ', '')}`,
            // TODO: collect votes
            votes: [],
          }

          const outFile = `./cache/${sessionNumber}/actions/${id}.json`

          // once we have the action, we should check if we already write this cache file
          // if we have, we load the file instead
          if (fs.existsSync(outFile)) {
            // replace action
          }

          // basically if the file exists, we append votes instead of making a new file
          console.log(`found ${votes.length} votes`)
          // TODO: then we have to dive in to the record

          fs.writeFileSync(outFile, JSON.stringify(action, null, 2))
        }
      }
    } catch (e) {
      console.log(e)
      process.exitCode = TxExitCode.BILL_SCAN_FAILURE
      return
    }
  }
}

/**
 * step 4: for every cache file that has an unresolved record vote (recorded in the file),
 * parse the record of the relevant day and attempt to resolve the votes.
 *
 * Record votes must record a vote for every representative. we can get the list of current representatives from
 * the database.
 */
function resolveRecordVotes() {}

// this part actually runs the script
try {
  // const sessionIds = await syncFtp()
  // DEBUG
  const sessionIds = ['89R']

  if (sessionIds.length > 0) {
    await syncJournals(sessionIds)
  } else {
    process.exitCode = TxExitCode.SESSION_IDS_MISSING
  }

  scanBillXml()
} catch (e) {
  console.log(e)
  process.exitCode = TxExitCode.GENERAL_FAILURE
}
