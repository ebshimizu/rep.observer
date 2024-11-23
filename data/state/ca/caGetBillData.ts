// the big script
import fs from 'fs-extra'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import type { LegislatureAction, StateMemberCache } from '../state-types'

const CaBillRoot = 'https://leginfo.legislature.ca.gov/faces/'
const CaBillSearch = `${CaBillRoot}/billSearchClient.xhtml`
const CaBillPage = `${CaBillRoot}/billNavClient.xhtml`
const CaBillStatus = `${CaBillRoot}/billStatusClient.xhtml`

/**
 * We actually do have historical data here so check if there's a cli arg
 */
const year =
  process.argv.length > 2 ? parseInt(process.argv[2]) : new Date().getFullYear()

// even years -1
const session = year % 2 === 1 ? year : year - 1

// they do encode it by stapling the years together
const caSessionId = `${session}${session + 1}`

const memberData = JSON.parse(
  fs.readFileSync(`./cache/${session}/members/members.json`).toString()
) as StateMemberCache
const members = Object.values(memberData.members)

/**
 * Attempts to resolve a CA member ID from a full name
 * @param name Name to search for
 */
function getMemberIdFromVoteName(name: string = '') {
  const lastNameMatch = members.find((m) =>
    m.last_name.toLowerCase() === name.toLowerCase()
  )

  if (lastNameMatch) {
    return lastNameMatch.id
  }

  // check full name
  const fullNameStrict = members.find(m => m.full_name.toLowerCase() === name.toLowerCase())

  if (fullNameStrict) {
    return fullNameStrict.id
  }

  // loosest check
  const fullNameFuzzy = members.find(m => m.full_name.toLowerCase().includes(name.toLowerCase()))

  return fullNameFuzzy?.id
}

// so first we have to get the root
async function getBillIndex(): Promise<
  Partial<LegislatureAction>[]
> {
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
      const billUid = `${caSessionId}0${billDisplayId?.replaceAll('-', '')}`

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
        number
      })
    }
  } else {
    console.error(
      'Failed to retrieve bill results table, returning empty object'
    )
  }

  // DEBUG
  fs.writeFileSync('./tmp.json', JSON.stringify(actions, null, 2))

  return actions
}

async function processBill(bill: Partial<LegislatureAction>) {
  const id = bill.id

  if (id) {
    // very first thing we need to do is check if the bill needs to be updated in our cache
    // we do this by checking the most recent history actions on the status page (which we need anyway to update title, etc.)
    const billInfo = await ((await fetch(`${CaBillStatus}?bill_id=${id}`)).text())
    const billNode = await parse(billInfo)

    const cacheFile = `./cache/${session}/actions/${id}.json`

    let lastUpdate = new Date('1776-07-04')

    if (fs.existsSync(cacheFile)) {
      lastUpdate = new Date(JSON.parse(fs.readFileSync(cacheFile).toString()).cache_updated_at)
    }


    fs.writeFileSync('tmp.xhtml', billInfo)

    // get the last updated date
    const lastAction = new Date(billNode.querySelector('#billhistory tbody tr td[scope="row"]')?.textContent ?? '')

    if (lastAction.getTime() > lastUpdate.getTime()) {
      console.log(`[Bill] Updating ${id}`)
    }
  } else {
    console.error('Failed to retrieve id from bill index. this probably means something exploded earlier in the script.')
  }
}

async function getBillData() {
  const billIndex = await getBillIndex()

  // ok so now we just have to get info on all of these things :)
  // DEBUG: just run like one of these
  for (const bill of billIndex.slice(0, 1)) {
    await processBill(bill)
  }
}

await getBillData()
