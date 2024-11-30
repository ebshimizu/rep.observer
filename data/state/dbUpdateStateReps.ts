/**
 * This file connects to the database in the current env file and updates representative data given
 * an input JSON file
 *
 * The input to this function should be a file path to a JSON file that contains two fields:
 * - sessions - array of sesion objects detailing the current sessions for each chamber
 * - members - member details, including their term data. Term data includes a reference to `sessionIndex` which
 *   is the corresponding element of the sessions array.
 *
 * When this script runs, we will first resolve the input sessions to IDs pulled from the current database.
 * This array will then be used to link the members with their corresponding terms in office for a given session.
 */
import dotenv from 'dotenv'
import path from 'path'

// this is typically called from a state directory, one level down
dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') })

import { createClient } from '@supabase/supabase-js'
import fs from 'fs-extra'
import type { StateMember, StateMemberCache, StateSession } from './state-types'

enum RepUpdateResult {
  Ok = 'OK',
  RepError = 'Rep Error',
  TermError = 'Term Error',
}

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

/**
 * Update the representatives in the member data cache file.
 * @param repData Representative data from the cache
 * @param sessions Session indices (should be database foreign keys)
 * @returns Status indicating if an error happened.
 */
async function processRep(repData: StateMember, sessions: number[]) {
  const updateRep = await supabase.from('representatives').upsert({
    id: repData.id,
    full_name: repData.full_name,
    first_name: repData.first_name,
    last_name: repData.last_name,
    homepage: repData.homepage,
  })

  if (updateRep.error) {
    console.error(updateRep.error)
    return RepUpdateResult.RepError
  }

  // term data
  const updateTerm = await supabase.from('terms').upsert({
    rep_id: repData.id,
    session_id: sessions[repData.term.sessionIndex],
    state: repData.term.state,
    district: repData.term.district,
    party: repData.term.party,
  })

  if (updateTerm.error) {
    console.error(updateTerm.error)
    return RepUpdateResult.TermError
  }

  console.log(`Updated [${repData.id}]`)

  return RepUpdateResult.Ok
}

/**
 * Creates the sessions listed in the members json file. Returns IDs for existing sessions.
 * Will also update existing sessions.
 * @param sessionData Session data in the members cache
 */
async function createSessionData(sessionData: StateSession[]) {
  // for each session
  const sessionIds: number[] = []

  for (const session of sessionData) {
    // check if the session exists
    // i think level + state + start time + chamber should be enough to get a unique ID
    const existingSession = await supabase
      .from('sessions')
      .select('*')
      .eq('level', 'state')
      .eq('state', session.state)
      .eq('start_date', session.start_date)
      .eq('chamber', session.chamber)
      .single()

    // if exists, push the existing data
    if (existingSession.data) {
      const updateSession = await supabase
        .from('sessions')
        .update({
          level: 'state',
          chamber: session.chamber,
          title: session.title,
          state: session.state,
          start_date: session.start_date,
          end_date: session.end_date,
        })
        .eq('id', existingSession.data.id)

      if (updateSession.error) {
        console.error(updateSession.error)
      }

      sessionIds.push(existingSession.data.id)
    } else {
      const createSession = await supabase
        .from('sessions')
        .insert({
          level: 'state',
          chamber: session.chamber,
          title: session.title,
          state: session.state,
          start_date: session.start_date,
          end_date: session.end_date,
        })
        .select()
        .single()

      if (createSession.error) {
        console.error(createSession.error)
        // if there was an error it's fatal at this point
        throw new Error(createSession.error.details)
      }

      sessionIds.push(createSession.data.id)
    }
  }

  console.log(`Session IDs resolved: ${sessionIds.join(', ')}`)

  return sessionIds
}

export async function processRepData(inputFilePath: string, scriptId: string) {
  const errorData: Record<string, any> = {}

  const results: Record<RepUpdateResult, number> = {
    [RepUpdateResult.Ok]: 0,
    [RepUpdateResult.RepError]: 0,
    [RepUpdateResult.TermError]: 0,
  }

  try {
    const fileData = JSON.parse(
      fs.readFileSync(inputFilePath).toString()
    ) as StateMemberCache

    const sessions = fileData.sessions

    const sessionIds = await createSessionData(sessions)

    for (const rep of Object.values(fileData.members)) {
      const result = await processRep(rep, sessionIds)

      results[result] += 1
    }

    console.log(`Representatives Updated
Ok: ${results[RepUpdateResult.Ok]}
Rep Error: ${results[RepUpdateResult.RepError]}
Term Error: ${results[RepUpdateResult.TermError]}`)
  } catch (e) {
    errorData.error = `${e}`
  }

  const status =
    results[RepUpdateResult.RepError] === 0 &&
    results[RepUpdateResult.TermError] === 0
      ? 'success'
      : 'error'

  const updateData: Record<string, any> = {
    script_id: scriptId,
    status: errorData?.error == null && status === 'success' ? 'success' : 'error',
    last_run: new Date(),
    result_data: results,
    error_data: errorData,
  }

  if (status === 'success') {
    updateData.last_success = updateData.last_run
  }

  await supabase.from('db_updates').upsert(updateData)
}
