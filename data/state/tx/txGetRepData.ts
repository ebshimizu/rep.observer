/**
 * Hello texas
 * like all state scripts, run this from ./tx
 */
import fs from 'fs-extra'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import type { StateMemberCache, StateSession } from '../state-types'

import { toOrdinal } from 'number-to-words'
import { validateIdUnique } from '../validateIdUnique'

const TxHouseUrl = 'https://house.texas.gov/members'
const TxSenateUrl = 'https://www.senate.texas.gov/members.php'
const TxSenateMemberUrl = 'https://www.senate.texas.gov/member.php'

const year =
  process.argv.length > 2 ? parseInt(process.argv[2]) : new Date().getFullYear()

// even years -1
const session = year % 2 === 1 ? year : year - 1

// make sure the cache exists
fs.ensureDirSync(`./cache/${session}`)
fs.ensureDirSync(`./cache/${session}/members`)
fs.ensureDirSync(`./cache/${session}/actions`)

const memberData: StateMemberCache['members'] = {}
const sessions: StateSession[] = []

console.log(`${session} session start year`)

async function processTxSenate() {
  const senatePage = await fetch(TxSenateUrl)
  const senateText = await senatePage.text()
  const senateDom = parse(senateText)

  // get the session number
  const pgTitle = senateDom.querySelector(
    '#main-content .onecolumn .pgtitle'
  )?.textContent
  // match numbers
  const sessionMatch = pgTitle?.match(/(\d+)/gi)

  const senateSession: StateSession = {
    level: 'state',
    state: 'TX',
    chamber: 'Senate',
    title: `${toOrdinal(parseInt(sessionMatch?.[0] ?? '1'))} TX State Senate`,
    start_date: `${session}-01-01`,
    // current sessions have no defined end date
    end_date: undefined,
  }

  sessions.push(senateSession)

  // the senate page is actually fairly nicely laid out right now.
  // the current members are marked with <div class=page-members__member">
  // and the divs even have some data attributes
  // get all members
  const memberNodes = senateDom.querySelectorAll('.mempicdiv')

  for (const node of memberNodes) {
    // create an ID as a provisional ID.
    // TX has the name in the alt attribute but with like extra spaces???
    const fullName = node
      .querySelector('img')
      ?.getAttribute('alt')
      ?.replaceAll('"', '')
      ?.replaceAll("'", '')
      ?.split(' ')
      .filter((s) => s !== '' && s !== ' ')
      .join(' ')

    const names = fullName?.split(' ')
    const district = parseInt(
      node.querySelector('.shrinkb')?.text.split(' ')[1] ?? '0'
    )

    // actually a separate fetch
    const detailsPage = await (
      await fetch(`${TxSenateMemberUrl}?d=${district}`)
    ).text()
    const detailsDom = parse(detailsPage)

    // unhinged query honestly
    const party = detailsDom
      .querySelectorAll('div.meminfo p.meminfo')
      .map((n) => n.text.split(' '))
      .find((data) => {
        if (data[0].toLowerCase().startsWith('party')) {
          return true
        }
      })?.[1][0]

    // if there is a conflict, we will add a number
    const provisionalId = `TX-${names?.[0][0]}${names?.[1]}`
    const id = await validateIdUnique(provisionalId, `${fullName}`, memberData)

    // put data in the cache
    memberData[id] = {
      id,
      first_name: `${names?.[0]}`,
      last_name: `${names?.[1]}`,
      full_name: `${fullName}`,
      homepage: `${TxSenateMemberUrl}?d=${district}`,
      term: {
        party: `${party}`,
        state: 'TX',
        district: district,
        sessionIndex: 0,
      },
    }

    console.log(
      `[Senate] Adding ${id} ${fullName} to cache (${memberData[id].term.party}-${memberData[id].term.district})`
    )
  }

  console.log('finished senate')

  // i don't feel like duplicating work, do you? returns the session number for the house to re-use
  return parseInt(sessionMatch?.[0] ?? '0')
}

interface TxHouseMemberData {
  active: number
  id: number
  image: string
  link: string
  member_bill_code: number
  member_name: string
}

async function processTxHouse(sessionNumber: number) {
  const housePage = await fetch(TxHouseUrl)
  const houseText = await housePage.text()
  const houseDom = parse(houseText)

  const houseSession: StateSession = {
    level: 'state',
    state: 'TX',
    chamber: 'House',
    title: `${toOrdinal(sessionNumber)} TX State House of Representatives`,
    start_date: `${session}-01-01`,
    // current sessions have no defined end date
    end_date: undefined,
  }

  sessions.push(houseSession)

  // the assembly page is not as nice as the senate
  // but we still know what the row selector is
  // been a while since i've thought about drupal
  const members = JSON.parse(
    houseDom.querySelector('get-members')?.getAttribute(':members') ?? '{ }'
  ) as TxHouseMemberData[]
  members.sort((a, b) => a.member_name.localeCompare(b.member_name))

  for (const member of members) {
    // create an ID as a provisional ID.
    const nameReversed = member.member_name
    const names = nameReversed?.split(',').map((n) => n.trim())
    const fullName = `${names?.[1]} ${names?.[0]}`

    // unfortunately. manual. party data not available on house website as far as i can tell
    // const party = node.querySelector('.rt-row__party div p')?.textContent[0]

    // we are going to do CA- + first initial + last name and then check conflicts
    // if there is a conflict, we will add a number
    const provisionalId = `TX-${names?.[1][0]}${names?.[0]}`

    // separate query
    const repPage = parse(await (await fetch(member.link)).text())
    const district = parseInt(
      repPage.querySelector('main h1')?.text.match(/(\d+)/gi)?.[0] ?? '0'
    )

    // this will be necessary for the next year of incoming representatives
    // we should flag duplicates to enable manual checks before fully processing
    const id = await validateIdUnique(provisionalId, `${fullName}`, memberData)

    // put data in the cache
    memberData[id] = {
      id,
      first_name: `${names?.[1]}`,
      last_name: `${names?.[0]}`,
      full_name: `${fullName}`,
      homepage: member.link,
      term: {
        party: 'R', // we will put R and then correct manually since R outnumbers D in TX usually
        state: 'TX',
        district: district,
        sessionIndex: 1,
      },
    }

    console.log(
      `[Assembly] Adding ${id} ${fullName} to cache (${memberData[id].term.party}-${memberData[id].term.district})`
    )
  }
}

const sessionNumber = await processTxSenate()
await processTxHouse(sessionNumber)

const fileOut = `./cache/${session}/members/members.json`
fs.writeFileSync(
  fileOut,
  JSON.stringify(
    {
      sessions,
      members: memberData,
      lastUpdated: new Date().toISOString(),
    },
    null,
    2
  )
)
