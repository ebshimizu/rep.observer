/**
 * This file connects to the database in the current env file and updates representative data for the
 * selected congress.
 */
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })

import fs from 'fs-extra'
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import n2w from 'number-to-words'

const supabase = createClient(
  process.env.SUPABASE_DB_URL,
  process.env.SUPABASE_KEY
)
const CONGRESS_API = 'https://api.congress.gov/v3'
const congress = parseInt(process.argv[2])

console.log(
  `fetching data for congress ${congress}}`
)

async function processRep(bioguideId, sessions) {
  // get the data from the congress api
  const bioReq = await fetch(
    `${CONGRESS_API}/member/${bioguideId}?api_key=${process.env.CONGRESS_API_KEY}`
  )
  const bioData = await bioReq.json()

  if (bioData) {
    // update rep
    const updateRep = await supabase.from('representatives').upsert(
      {
        id: bioguideId,
        full_name: bioData.member.directOrderName,
        first_name: bioData.member.firstName,
        last_name: bioData.member.lastName,
      }
    )

    if (updateRep.error) {
      console.error(updateRep.error)
    }

    // where are we
    const mostRecentTerm = bioData.member.terms[bioData.member.terms.length - 1]
    const sid =
      mostRecentTerm.chamber === 'Senate' ? sessions.senate : sessions.house
    const party =
      bioData.member.partyHistory[bioData.member.partyHistory.length - 1]
        .partyName

    // update or insert term data
    const updateTerm = await supabase.from('terms').upsert({
      rep_id: bioguideId,
      session_id: sid,
      state: mostRecentTerm.stateCode,
      district: mostRecentTerm.chamber === 'Senate' ? null : mostRecentTerm?.district ?? 1,
      party,
    })

    if (updateTerm.error) {
      console.log(updateTerm.error)
      return false
    }

    return true
  } else {
    console.error(`${bioguideId} request failed`)
    return false
  }
}

async function processReps(sessions) {
  const repFile = `./cache/${congress}/representatives.json`
  const repData = JSON.parse(fs.readFileSync(repFile))

  const reps = Object.values(repData)
  console.log(
    `found ${reps.length} representatives in national congress number ${congress}`
  )

  let success = 0

  for (let i = 0; i < reps.length; i++) {
    const rep = reps[i]

    // the VP has a special rep field in this DB
    if (rep === 'VP') {
      continue
    }

    console.log(`[${i + 1} / ${reps.length}] Processing ID ${rep.id}`)
    const result = await processRep(rep.id, sessions)

    if (!result) {
      console.error(`failed to process ${rep.id}`)
    } else {
      success += 1
    }
  }

  console.log(`updated ${success} / ${reps.length} representatives`)
}

async function createTermData() {
  // check if exists
  const house = await supabase
    .from('sessions')
    .select('*')
    .eq('level', 'national')
    .eq('congress', congress)
    .eq('chamber', 'House of Representatives')

  const senate = await supabase
    .from('sessions')
    .select('*')
    .eq('level', 'national')
    .eq('congress', congress)
    .eq('chamber', 'Senate')

  // get the data for the congressional session
  const sessionReq = await fetch(
    `${CONGRESS_API}/congress/${congress}?api_key=${process.env.CONGRESS_API_KEY}`
  )
  const sessionData = await sessionReq.json()

  const sortedStartDates = sessionData.congress.sessions
    .map((s) => new Date(s.startDate).getTime())
    .sort((a, b) => a - b)

  const sortedEndDates = sessionData.congress.sessions
    .map((s) => new Date(s.endDate).getTime())
    .sort((a, b) => b - a)

  const startDate = new Date(sortedStartDates[0])

  // could be in progress
  const endDate = sortedEndDates.some((d) => isNaN(d))
    ? null
    : new Date(sortedEndDates[0])

  let senateId = null
  let houseId = null

  if (house.data.length > 0) {
    // update
    console.log('updating house session')
    const houseUpdate = await supabase
      .from('sessions')
      .update({
        level: 'national',
        chamber: 'House of Representatives',
        congress,
        title: `${n2w.toOrdinal(
          congress
        )} United States Congress - House of Representatives`,
        start_date: startDate,
        end_date: endDate,
      })
      .eq('id', house.data[0].id)

    if (houseUpdate.error) {
      console.error(houseInsert.error)
    }

    houseId = house.data[0].id
  } else {
    console.log('creating house session')
    const houseInsert = await supabase.from('sessions').insert({
      level: 'national',
      chamber: 'House of Representatives',
      congress,
      title: `${n2w.toOrdinal(
        congress
      )} United States Congress - House of Representatives`,
      start_date: startDate,
      end_date: endDate,
    })

    if (houseInsert.error) {
      console.error(houseInsert.error)
    }

    houseId = houseInsert.data[0].id
  }

  if (senate.data.length > 0) {
    // update
    console.log('updating senate session')
    const senateUpdate = await supabase
      .from('sessions')
      .update({
        level: 'national',
        chamber: 'Senate',
        congress,
        title: `${n2w.toOrdinal(congress)} United States Congress - Senate`,
        start_date: startDate,
        end_date: endDate,
      })
      .eq('id', senate.data[0].id)

    if (senateUpdate.error) {
      console.error(houseInsert.error)
    }

    senateId = senate.data[0].id
  } else {
    console.log('creating senate session')
    const senateInsert = await supabase.from('sessions').insert({
      level: 'national',
      chamber: 'Senate',
      congress,
      title: `${n2w.toOrdinal(congress)} United States Congress - Senate`,
      start_date: startDate,
      end_date: endDate,
    })

    if (senateInsert.error) {
      console.error(senateInsert.error)
    }

    senateId = senateInsert.data[0].id
  }

  return { house: houseId, senate: senateId }
}

const sessions = await createTermData()
await processReps(sessions)
