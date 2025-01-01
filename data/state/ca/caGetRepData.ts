/**
 * This script should be run from within the CA state directory. This script shouldn't need to run too frequently,
 * so it's not part of the nightly cron jobs
 * 
 * Output from this script might need manual cleanup from time to time, as reps move to different levels
 * or change names on me.
 */
import fs from 'fs-extra'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import type { StateMemberCache, StateSession } from '../state-types'

import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') })


const CaAssemblyUrl = 'https://www.assembly.ca.gov/assemblymembers'
const CaSenateUrl = 'https://www.senate.ca.gov/senators'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

/**
 * we have no way of accessing historical data so this is just the current year (-1 if year is even, CA always starts odd year)
 */
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

/**
 * given a member id, check if it's a valid unique id. if not, this function will correct the id and return it
 */
async function validateIdUnique(id: string, full_name: string) {
  // TODO: Database check here to get full ID
  // get the database duplicates
  const query = await supabase
    .from('representatives')
    .select('*')
    .like('id', `${id}%`)

  // check if there's an exact match in the query. An exact match is when the id and full name are the same
  const exactMatch = query.data?.find(
    (d) => d.id === id && d.full_name.toLowerCase() === full_name.toLowerCase()
  )

  if (exactMatch) {
    console.log(`[ID] Exact match found for ${id} (${full_name})`)
    return exactMatch.id
  }

  // check if there's a likely match (full names are identical)
  // this will be returned with a log warning to do a check
  const likelyMatch = query.data?.find(
    (d) => d.full_name.toLowerCase() === full_name.toLowerCase()
  )

  if (likelyMatch) {
    console.log(
      `[ID VERIFICATION NEEDED] Likely match ${likelyMatch.id} found for ${full_name}, manually check that this is the same person.`
    )
    return likelyMatch.id
  }

  // if there's no match and a duplicate, combine local and remote list of dupes to get a unique suffix
  const possibleLocalDupes = Object.keys(memberData).filter((k) =>
    k.startsWith(id)
  )
  const dupCount = possibleLocalDupes.length + (query.data?.length ?? 0)

  if (dupCount > 0) {
    // make a new one
    const newId = `${id}${dupCount + 1}`
    console.log(
      `id conflict found in cache and database, adjusting ${id} => ${newId}`
    )
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
    title: `CA State Senate - ${session}-${session + 1} Session`,
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
    const id = await validateIdUnique(provisionalId, `${fullName}`)

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
    title: `CA State Assembly - ${session}-${session + 1} Session`,
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
    // this will be necessary for the next year of incoming representatives
    // we should flag duplicates to enable manual checks before fully processing
    const id = await validateIdUnique(provisionalId, `${fullName}`)

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
