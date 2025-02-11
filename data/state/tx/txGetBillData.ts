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
    const sessionIdentifiers = relevant.map(d => d.name)

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
  // senate: https://journals.senate.texas.gov/sjrnl/[code]/html/
  // house: https://journals.house.texas.gov/hjrnl/[code]/html/
}

/**
 * step 3: scan the bill files and write cache files for anything mentioning a "Record Vote" or "RV"
 */
function scanBillXml() {

}

/**
 * step 4: for every cache file that has an unresolved record vote (recorded in the file),
 * parse the record of the relevant day and attempt to resolve the votes.
 * 
 * Record votes must record a vote for every representative. we can get the list of current representatives from
 * the database.
 */
function resolveRecordVotes() {

}

// this part actually runs the script
await syncFtp()