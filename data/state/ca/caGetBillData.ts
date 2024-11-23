// the big script
import fs from 'fs-extra'
import fetch from 'node-fetch'
import { HTMLElement, Node, parse } from 'node-html-parser'
import type { LegislatureAction, StateMemberCache, Vote } from '../state-types'

enum BillResult {
  New = 'New',
  Modified = 'Modified',
  Unchanged = 'Unchanged',
  SkippedNoRelevantVotes = 'Skipped: No Relevant Votes',
  Error = 'Error',
}

const CaBillRoot = 'https://leginfo.legislature.ca.gov/faces'
const CaBillSearch = `${CaBillRoot}/billSearchClient.xhtml`
const CaBillPage = `${CaBillRoot}/billNavClient.xhtml`
const CaBillStatus = `${CaBillRoot}/billStatusClient.xhtml`
const CaBillVotes = `${CaBillRoot}/billVotesClient.xhtml`
const CaBillAnalysis = `${CaBillRoot}/billAnalysisClient.xhtml`

/**
 * We actually do have historical data here so check if there's a cli arg
 */
const year =
  process.argv.length > 2 ? parseInt(process.argv[2]) : new Date().getFullYear()

// even years -1
const session = year % 2 === 1 ? year : year - 1

// they do encode it by stapling the years together
const caSessionId = `${session}${session + 1}`

fs.ensureDirSync(`./cache/${session}/actions`)
const memberData = JSON.parse(
  fs.readFileSync(`./rep_data/${caSessionId}_members.json`).toString()
) as StateMemberCache

const members = Object.values(memberData.members)

/**
 * Attempts to resolve a CA member ID from a full name
 * @param name Name to search for
 */
function getMemberIdFromVoteName(name: string = '') {
  const lastNameMatch = members.find(
    (m) => m.last_name.toLowerCase() === name.toLowerCase()
  )

  if (lastNameMatch) {
    return lastNameMatch.id
  }

  // check full name
  const fullNameStrict = members.find(
    (m) => m.full_name.toLowerCase() === name.toLowerCase()
  )

  if (fullNameStrict) {
    return fullNameStrict.id
  }

  // loosest check
  const fullNameFuzzy = members.find((m) =>
    m.full_name.toLowerCase().includes(name.toLowerCase())
  )

  if (fullNameFuzzy) {
    return fullNameFuzzy.id
  }

  // alt name check
  // final fallback
  const altNameCheck = members.find((m) =>
    m.alt_name?.toLowerCase().includes(name.toLowerCase())
  )

  if (altNameCheck == null) {
    console.warn(`Unable to resolve member ID for name fragment ${name}`)
  }

  return altNameCheck?.id
}

function getTypeFromId(id: string = '') {
  const code = id.substring(1, id.indexOf('-'))

  if (code.startsWith('B')) {
    return 'bill'
  } else if (code.startsWith('CR')) {
    return 'concurrent resolution'
  } else if (code.startsWith('JR')) {
    return 'joint resolution'
  } else if (code.startsWith('R')) {
    return 'resolution'
  }

  console.log(`unknown resolution type: ${code}`)
  return ''
}

// so first we have to get the root
async function getBillIndex(): Promise<Partial<LegislatureAction>[]> {
  // get all bills
  const billIndexRoot = await fetch(
    `${CaBillSearch}?author=All&lawCode=All&session_year=${caSessionId}&house=Both`
  )

  const billIndexText = await billIndexRoot.text()
  const billIndex = await parse(billIndexText)
  const actions: Partial<LegislatureAction>[] = []

  // debug
  // fs.writeFileSync('./billIndex.xhtml', billIndexText)

  // ok so this is a giant table...
  // so we just get all the rows excluding the header (skip thead)
  const bills = billIndex
    .querySelector('#bill_results tbody')
    ?.querySelectorAll('tr')

  if (bills) {
    console.log(`[Index] Retrieving index data for ${bills.length} bills`)
    for (const bill of bills) {
      // parse what we can
      const cells = bill.querySelectorAll('td')
      const billDisplayId = cells?.[0].querySelector('a')?.textContent.trim()
      const subject = cells?.[1].textContent
      const introducedBy = cells?.[2].textContent
      const status = cells?.[3].textContent
      const sponsorId = getMemberIdFromVoteName(introducedBy)

      const billUrl = cells?.[0].querySelector('a')?.getAttribute('href')
      const billUid = billUrl?.substring(billUrl.indexOf('=') + 1)
      const number = parseInt(billDisplayId?.split('-')?.[1] ?? '0')

      actions.push({
        id: billUid,
        short_title: `${billDisplayId} ${subject}`,
        sponsor_id: sponsorId,
        sponsor_type: sponsorId == null ? introducedBy : 'person',
        status,
        state: 'CA',
        chamber: billDisplayId?.[0].toLowerCase(),
        source_url: `${CaBillPage}?bill_id=${billUid}`,
        number,
      })
    }
  } else {
    console.error(
      'Failed to retrieve bill results table, returning empty object'
    )
  }

  return actions
}

function processRepVotes(rows: HTMLElement[]) {
  const repVotes: Record<string, string> = {}

  // process row by row
  for (const row of rows) {
    // first status cell should have the vote type
    const type =
      row.querySelector('.statusCell span')?.textContent.toLowerCase() ?? ''

    if (type !== '') {
      // depluralize
      const recordType = type === 'ayes' ? 'aye' : type === 'noes' ? 'no' : type
      const members =
        row.querySelector('.statusCellData span')?.textContent.split(',') ?? []

      members.forEach((m) => {
        const id = getMemberIdFromVoteName(m.trim())
        if (id) {
          repVotes[id] = recordType
        }
      })
    }
  }

  return repVotes
}

async function processBill(bill: Partial<LegislatureAction>) {
  const id = bill.id

  if (id) {
    // very first thing we need to do is check if the bill needs to be updated in our cache
    // we do this by checking the most recent history actions on the status page (which we need anyway to update title, etc.)
    const billInfo = await (await fetch(`${CaBillStatus}?bill_id=${id}`)).text()
    const billNode = await parse(billInfo)

    const cacheFile = `./cache/${session}/actions/${id}.json`

    let lastUpdate = new Date('1776-07-04')
    let cache = bill
    let isNew = true

    if (fs.existsSync(cacheFile)) {
      const cacheData = JSON.parse(
        fs.readFileSync(cacheFile).toString()
      ) as LegislatureAction
      lastUpdate = new Date(cacheData.cache_updated_at)
      isNew = false

      // populate index cache with current bill cache
      cache = {
        ...bill,
        ...cacheData,
      }
    }

    // get the last updated date
    const lastAction = new Date(
      billNode.querySelector('#billhistory tbody tr td[scope="row"]')
        ?.textContent ?? ''
    )

    if (lastAction.getTime() > lastUpdate.getTime()) {
      console.log(`[Bill] Updating ${id}`)

      // update core data, assume we're starting from nothing here
      cache.id = id
      cache.type = getTypeFromId(
        billNode.querySelector('#measureNum')?.textContent
      )
      cache.level = 'state'
      cache.state = 'CA'
      // manual correction, HR is HR instead of AR I guess
      cache.chamber = cache.chamber?.toLowerCase() === 'h' ? 'a' : cache.chamber
      // this is in a really weird tag
      cache.official_title = billNode
        .querySelector('#statusTitle')
        ?.textContent.trim()
      cache.top_tag = billNode
        .querySelector('#subject')
        ?.textContent.replaceAll('.', '')
        .trim()

      // format the coauthors if this isn't coming from a committee
      // this should be noted in the sponsor type
      if (!cache.sponsor_type?.toLocaleLowerCase().startsWith('committee')) {
        const authors: string[] = []
        authors.push(
          ...(billNode
            .querySelector('#leadAuthors')
            ?.textContent.trim()
            .split(',') ?? [])
        )
        authors.push(
          ...(billNode
            .querySelector('#principalAuthors')
            ?.textContent.trim()
            .split(',') ?? [])
        )
        authors.push(
          ...(billNode
            .querySelector('#coAuthors')
            ?.textContent.trim()
            .split(',') ?? [])
        )

        cache.cosponsors = authors
          .map((a) => {
            const authorClean = a.substring(0, a.indexOf('(')).trim()
            const authorId = getMemberIdFromVoteName(authorClean)

            if (authorId) {
              return {
                id: authorId,
              }
            }

            return undefined
          })
          .filter((a) => a != null)
      }

      // get the analysis link. i was going to link to the pdf but it seems to trigger a JS function that performs
      // a download instead of having a static link
      cache.summary = {
        analysis_link: `${CaBillAnalysis}?bill_id=${id}`,
      }

      // check the votes
      if (cache.votes == null) {
        cache.votes = []
      }
      const mostRecentVote =
        cache.votes.length > 0
          ? new Date(cache.votes[cache.votes.length - 1].date)
          : new Date('1776-07-04')

      const votesPage = await (
        await fetch(`${CaBillVotes}?bill_id=${id}`)
      ).text()
      const votesRoot = await parse(votesPage)

      const voteNodes = votesRoot.querySelectorAll('.status')
      for (const vote of voteNodes) {
        const rows = vote.querySelectorAll('.statusRow')

        // check if this is an assembly floor or senate floor vote, we don't track committee votes here (at the moment)
        const location =
          rows?.[2].querySelector('.statusCellData span')?.textContent ?? ''

        if (
          location.toLowerCase() === 'assembly floor' ||
          location.toLowerCase() === 'senate floor'
        ) {
          const date = new Date(
            rows?.[0].querySelector('.statusCellData span')?.textContent ?? ''
          )

          if (date.getTime() > mostRecentVote.getTime()) {
            console.log(`[Bill] found new assembly vote for ${id}`)
            const result =
              rows?.[1].querySelector('.statusCellData span')?.textContent ?? ''
            const resultFormatted =
              result.length > 0
                ? result.substring(1, result.length - 1).toLowerCase()
                : result

            const repVotes = processRepVotes(rows?.slice(rows.length - 3))

            const voteData: Vote = {
              chamber: location === 'assembly floor' ? 'a' : 's',
              question:
                rows?.[6].querySelector('.statusCellData span')?.textContent ??
                '',
              result: resultFormatted,
              date: date.toISOString(),
              cache_updated_at: date.toISOString(),
              source_url: `${CaBillVotes}?bill_id=${id}`,
              rep_votes: repVotes,
            }

            cache.votes.push(voteData)
          }
        } else {
          console.log(`[Bill] ${id} skipping non-floor vote ${location}`)
        }
      }

      // if the new cache has more than one vote, write it
      if (cache.votes.length > 0) {
        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
        console.log(`[Bill] ${id} written to disk`)
        return isNew ? BillResult.New : BillResult.Modified
      } else {
        console.log(`[Bill] ${id} skipped, no relevant votes on record`)
        return BillResult.SkippedNoRelevantVotes
      }
    } else {
      console.log(`[Bill] ${id} unchanged`)
      return BillResult.Unchanged
    }
  } else {
    console.error(
      'Failed to retrieve id from bill index. this probably means something exploded earlier in the script.'
    )
  }

  return BillResult.Error
}

async function getBillData() {
  const billIndex = await getBillIndex()

  const results: Record<BillResult, number> = {
    [BillResult.New]: 0,
    [BillResult.Modified]: 0,
    [BillResult.SkippedNoRelevantVotes]: 0,
    [BillResult.Unchanged]: 0,
    [BillResult.Error]: 0,
  }

  // ok so now we just have to get info on all of these things :)
  // DEBUG: just run like one of these
  for (const bill of billIndex) {
    const result = await processBill(bill)

    results[result] += 1
  }

  console.log('Import Finished')
  Object.entries(results).forEach((r) => {
    console.log(`[${r[0]}] - ${r[1]}`)
  })
}

await getBillData()
