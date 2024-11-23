/**
 * Output from this script might need manual cleanup from time to time, as reps move to different levels
 * or change names on me.
 */
import fs from 'fs-extra'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import type { StateMemberCache, StateSession } from '../state-types'

const CaAssemblyUrl = 'https://www.assembly.ca.gov/assemblymembers'
const CaSenateUrl = 'https://www.senate.ca.gov/senators'

/**
 * we have no way of accessing historical data so this is just the current year (-1 if year is even, CA always starts odd year)
 */
const year = new Date().getFullYear()

// even years -1
const session = year % 2 === 1 ? year : year - 1

// make sure the cache exists
fs.ensureDirSync(`./cache/${session}`)
fs.ensureDirSync(`./cache/${session}/members`)
fs.ensureDirSync(`./cache/${session}/actions`)

const memberData: StateMemberCache['members'] = {}
const sessions: StateSession[] = []

console.log(`${session} session start year`)

/**
 * given a member id, check if it's a valid unique id. if not, this function will correct the id and return it
 */
async function validateIdUnique(id: string) {
  // TODO: Database check here to get full ID
  const possibleDupes = Object.keys(memberData).filter((k) => k.startsWith(id))
  if (possibleDupes.length > 0) {
    // make a new one
    const newId = `${id}${possibleDupes.length + 1}`
    console.log(`id conflict found in cache, adjusting ${id} => ${newId}`)
    return newId
  }

  return id
}

async function processCaSenate() {
  const senatePage = await fetch(CaSenateUrl)

  const senateText = await senatePage.text()

  const senateDom = parse(senateText)

  const senateSession: StateSession = {
    level: 'state',
    state: 'CA',
    chamber: 'Senate',
    title: 'CA State Senate - 2023-2024 Session',
    start_date: `${session}-01-01`,
    // current sessions have no defined end date
    end_date: undefined,
  }

  sessions.push(senateSession)

  // the senate page is actually fairly nicely laid out right now.
  // the current members are marked with <div class=page-members__member">
  // and the divs even have some data attributes
  // get all members
  const memberNodes = senateDom.querySelectorAll('.page-members__member')

  for (const node of memberNodes) {
    // create an ID as a provisional ID.
    const fullName = node.querySelector('.member__name')?.textContent

    if (fullName?.toLowerCase().includes('deferred district')) {
      console.log(`Skipping ${fullName}`)
      continue
    }

    const names = fullName?.split(' ')
    const party = node
      .querySelector('.member__party')
      ?.getAttribute('data-party')

    // we are going to do CA- + first initial + last name and then check conflicts
    // if there is a conflict, we will add a number
    const provisionalId = `CA-${names?.[0][0]}${names?.[1]}`
    const id = await validateIdUnique(provisionalId)

    // put data in the cache
    memberData[id] = {
      id,
      first_name: `${names?.[0]}`,
      last_name: `${names?.[1]}`,
      full_name: `${fullName}`,
      homepage: `${node.querySelector('.member__link')?.getAttribute('href')}`,
      term: {
        party: `${party}`,
        state: 'CA',
        district: parseInt(
          `${node
            .querySelector('.member__district')
            ?.getAttribute('data-district')}`
        ),
        sessionIndex: 0,
      },
    }

    console.log(
      `[Senate] Adding ${id} ${fullName} to cache (${memberData[id].term.party}-${memberData[id].term.district})`
    )
  }

  console.log('finished senate')
}

async function processCaAssembly() {
  // similar to the senate
  // ... yeah i mean i could change the variable names
  // but i won't
  const assPage = await fetch(CaAssemblyUrl)
  const assText = await assPage.text()
  const assDom = parse(assText)

  const assSession: StateSession = {
    level: 'state',
    state: 'CA',
    chamber: 'Assembly',
    title: 'CA State Assembly - 2023-2024 Session',
    start_date: `${session}-01-01`,
    // current sessions have no defined end date
    end_date: undefined,
  }

  sessions.push(assSession)

  // the assembly page is not as nice as the senate
  // but we still know what the row selector is
  // been a while since i've thought about drupal
  const memberNodes = assDom.querySelectorAll('.rt-row__inner-wrapper')

  for (const node of memberNodes) {
    // create an ID as a provisional ID.
    const nameReversed = node.querySelector('.rt-row__name div a')?.textContent
    const names = nameReversed?.split(',').map((n) => n.trim())
    const fullName = `${names?.[1]} ${names?.[0]}`

    // right the name gets flipped
    if (fullName.toLowerCase() === 'member vacant') {
      console.log(`Skipping ${fullName}`)
      continue
    }

    const party = node.querySelector('.rt-row__party div p')?.textContent[0]

    // we are going to do CA- + first initial + last name and then check conflicts
    // if there is a conflict, we will add a number
    const provisionalId = `CA-${names?.[1][0]}${names?.[0]}`

    // TODO: Database check here to get full ID
    const id = await validateIdUnique(provisionalId)

    // put data in the cache
    memberData[id] = {
      id,
      first_name: `${names?.[0]}`,
      last_name: `${names?.[1]}`,
      full_name: `${fullName}`,
      homepage: `${node
        .querySelector('.link--district')
        ?.getAttribute('href')}`,
      term: {
        party: `${party}`,
        state: 'CA',
        district: parseInt(
          `${node.querySelector('.rt-row__district div p')?.textContent}`
        ),
        sessionIndex: 1,
      },
    }

    console.log(
      `[Assembly] Adding ${id} ${fullName} to cache (${memberData[id].term.party}-${memberData[id].term.district})`
    )
  }
}

await processCaSenate()
await processCaAssembly()

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
