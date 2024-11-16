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
import type { CongressResponse, RepCacheData } from './national-types'
import HistoricalMemberData from './rep_data/legislators-historical.json'

const supabase = createClient(
  process.env.SUPABASE_DB_URL ?? '',
  process.env.SUPABASE_KEY ?? ''
)
const CONGRESS_API = 'https://api.congress.gov/v3'
const congress = parseInt(process.argv[2])

console.log(
  `fetching data for congress ${congress}}`
)


// we're going to elide types here for convenience
const currentMemberData = JSON.parse(fs.readFileSync(`./rep_data/${congress}.json`).toString()) as any[]
const AllMemberData = [...currentMemberData, ...HistoricalMemberData as any[]]

function findFullMemberData(bioguideId: string) {
  return AllMemberData.find(m => m.id.bioguide === bioguideId)
}

async function processRep(bioguideId: string, sessions: { house: number, senate: number}) {
  // get the data from the congress api
  const bioReq = await fetch(
    `${CONGRESS_API}/member/${bioguideId}?api_key=${process.env.CONGRESS_API_KEY}`
  )
  const bioData = await bioReq.json() as CongressResponse

  if (bioData) {
    // update rep
    const fullData = findFullMemberData(bioguideId)

    const mostRecentTermData = fullData != null ? fullData.terms[fullData.terms.length - 1] : null

    const updateRep = await supabase.from('representatives').upsert(
      {
        id: bioguideId,
        full_name: bioData.member.directOrderName,
        first_name: bioData.member.firstName,
        last_name: bioData.member.lastName,
        homepage: mostRecentTermData?.url,
        govtrack_id: fullData?.id?.govtrack
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

async function processReps(sessions: { house: number, senate: number }) {
  const repFile = `./cache/${congress}/representatives.json`
  const repData = JSON.parse(fs.readFileSync(repFile).toString()) as Record<string, RepCacheData>

  const reps = Object.values(repData)
  console.log(
    `found ${reps.length} representatives in national congress number ${congress}`
  )

  let success = 0

  for (let i = 0; i < reps.length; i++) {
    const rep = reps[i]

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

async function createTermData(): Promise<{ house: number, senate: number }> {
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
  const sessionData = await sessionReq.json() as CongressResponse

  const sortedStartDates = sessionData.congress.sessions
    .map((s) => new Date(s.startDate).getTime())
    .sort((a, b) => a - b)

  const sortedEndDates = sessionData.congress.sessions
    // we will let this fall through to nan
    .map((s) => new Date(s.endDate!).getTime())
    .sort((a, b) => b - a)

  const startDate = new Date(sortedStartDates[0])

  // could be in progress
  const endDate = sortedEndDates.some((d) => isNaN(d))
    ? null
    : new Date(sortedEndDates[0])

  let senateId = null
  let houseId = null

  if (house.data && house.data.length > 0) {
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
      console.error(houseUpdate.error)
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

    if (houseInsert.data) {
      houseId = (houseInsert.data[0] as any).id
    }
  }

  if (senate.data && senate.data.length > 0) {
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
      console.error(senateUpdate.error)
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

    if (senateInsert.data){
      senateId = (senateInsert.data[0] as any).id
    }
  }

  return { house: houseId, senate: senateId }
}

const sessions = await createTermData()
await processReps(sessions)
