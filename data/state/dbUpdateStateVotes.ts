/**
 * This file connects to the database in the current env file and updates representative voting data
 * from the specified cache location.
 *
 * This script expects a cache that looks like:
 * - actions - folder containing the json files for the legislative actions and votes
 *   - each json file in here should match the LegislatureAction type definition
 * - cache_updated_at.json - file containing the date at which the cache was updated
 *
 * You also need to provide the relevant session IDs for each chamber.
 * There is a helper function in this file that can retrieve the specified sessions in a member
 * cache file.
 */
import dotenv from 'dotenv'
import path from 'path'
import moment from 'moment'

// this is typically called from a state directory, one level down
dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') })

import { createClient } from '@supabase/supabase-js'
import fs from 'fs-extra'
import type { LegislatureAction, StateSession } from './state-types'

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

enum ProcessVoteResult {
  Failed = 'Failed',
  NoChange = 'No Change',
  Updated = 'Updated',
}

// list of errors that happened during script execution
const GlobalErrors: any[] = []

/**
 * Process the vote data and upload to database
 * @param data Bill data
 * @param dbUpdatedAt the last time this script ran successfully
 * @param sessionId House and senate session ids (maps to sessions table)
 * @returns Object representing status
 */
async function processVote(
  data: LegislatureAction,
  dbUpdatedAt: Date,
  sessionIds: Record<string, number>
) {
  // check the cache time for the action. If the
  const returnData = {
    action: ProcessVoteResult.Failed,
    votesRecorded: 0,
  }

  try {
    // bill data update conditions are
    // bill metadata was changed
    // we're going to give a one day buffer because I don't want to deal with time zones :)
    const updatedAt = moment(new Date(data.cache_updated_at)).subtract(1, 'day').toDate()

    // this is a bit different than the national level, but the state script does expect that the
    // cache file updatedAt date is updated if a new vote comes in
    if (updatedAt < dbUpdatedAt) {
      returnData.action = ProcessVoteResult.NoChange
    } else {
      console.log(
        `[${data.id}] Processing updated data (${data.cache_updated_at})`
      )
      // do the update
      // this is mostly an upsert where we just overwrite what's there
      const actionResult = await supabase.from('actions').upsert({
        id: data.id,
        type: data.type,
        level: data.level,
        chamber: data.chamber,
        session_id: sessionIds[data.chamber],
        bill_type: data.bill_type,
        number: data.number,
        official_title: data.official_title,
        popular_title: data.popular_title,
        short_title: data.short_title,
        sponsor_id: data.sponsor_id,
        sponsor_type: data.sponsor_type,
        status: data.status,
        status_at: new Date(data.status_at),
        tags: data.tags,
        top_tag: data.top_tag,
        summary: data?.summary ? JSON.stringify(data.summary) : null,
        cache_updated_at: new Date(data.cache_updated_at),
        source_url: data.source_url,
      })

      if (actionResult.error) {
        returnData.action = ProcessVoteResult.Failed
        GlobalErrors.push(`${actionResult.error}`)
        console.error(actionResult.error)
        return returnData
      }

      console.log(`[${data.id}] Action data updated`)

      // update amendments
      // now, not every state tracks amendments the same way. Currently we're skipping processing for this,
      // will determine how to update this script later if needed

      // update cosponsors
      const cosponsors = data?.cosponsors ?? []

      // just run it down honestly. batch upsert.
      if (cosponsors.length > 0) {
        console.log(`[${data.id}] Updating co-sponsors`)
        const result = await supabase.from('bill_cosponsors').upsert(
          cosponsors.map((c) => ({
            rep_id: c.id,
            action_id: data.id,
            original_cosponsor: c.original_cosponsor,
            sponsored_at: c.sponsored_at ? new Date(c.sponsored_at) : null,
            withdrawn_at:
              c.withdrawn_at == null ? null : new Date(c.withdrawn_at),
          }))
        )

        if (result.error) {
          console.error(result.error)
          returnData.action = ProcessVoteResult.Failed
          GlobalErrors.push(result.error)
          return returnData
        }
      }

      returnData.action = ProcessVoteResult.Updated
    }

    // check the votes
    for (const vote of data.votes) {
      // votes don't actually update after they're taken (usually)
      // which seems like an obvious thing to write BUT
      const voteUpdatedAt = new Date(vote.date)

      if (voteUpdatedAt > dbUpdatedAt) {
        console.log(`[${data.id}] updating vote ${vote.alternate_id}`)

        // we're going to use the alternate_id field here to quickly insert stuff
        const voteResult = await supabase
          .from('votes')
          .upsert(
            {
              alternate_id: vote.alternate_id,
              action_id: data.id,
              result: vote.result,
              question: vote.question,
              type: vote.type,
              chamber: vote.chamber,
              congress: vote.congress,
              session: sessionIds[vote.chamber],
              requires: vote.requires,
              number: vote.number,
              date: new Date(vote.date),
              cache_updated_at: new Date(vote.cache_updated_at),
            },
            {
              onConflict: 'alternate_id',
            }
          )
          .select()
          .single()

        if (voteResult.error) {
          console.error(voteResult.error)
          returnData.action = ProcessVoteResult.Failed
          GlobalErrors.push(voteResult.error)
          // ... eh not the best error handling but oh well at least it logs
          return returnData
        }

        const voteRecordId = voteResult.data.id

        // record the rep votes
        const repVotesResult = await supabase.from('rep_votes').upsert(
          Object.entries(vote.rep_votes).map(([id, r]) => {
            return {
              rep_id: id,
              vote_id: voteRecordId,
              vote: r,
            }
          })
        )

        if (repVotesResult.error) {
          console.error(repVotesResult.error)
          GlobalErrors.push(repVotesResult.error)
          returnData.action = ProcessVoteResult.Failed
          return returnData
        }

        console.log(`[${data.id}] Recorded votes for ${vote.alternate_id}`)
        returnData.votesRecorded += 1
      }
    }
  } catch (e) {
    console.error(e)
    returnData.action = ProcessVoteResult.Failed
    return returnData
  }

  return returnData
}

/**
 * Returns the current open sessions for the given state
 * @param state State by two letter code, capitalized
 */
export async function getCurrentStateSessions(state: string) {
  const sessionData: Record<string, StateSession & { id: number }> = {}

  const currentSessions = await supabase
    .from('sessions')
    .select('*')
    .eq('state', state)
    .is('end_date', null)

  if (currentSessions.data) {
    currentSessions.data.forEach((s) => {
      sessionData[s.chamber] = s
    })
  }

  return sessionData
}

/**
 * Update vote data in the database given a cache directory
 * @param cachePath Path to the state data cache
 * @param sessionIds Active session IDs keyd by `chamber`. You should ensure that the values you pass in this
 * argument are actually found in your data cache's `chamber` field.
 * @param scriptId Identifier to write DB status messages to
 */
export async function updateVotes(
  cachePath: string,
  sessionIds: Record<string, number>,
  scriptId: string
) {
  // retrieve the last updated data from the db
  const lastUpdated = await supabase
    .from('db_updates')
    .select('*')
    .eq('script_id', scriptId)

  if (lastUpdated.error) {
    console.error('Unable to retrieve database last updated at data')
    console.error(lastUpdated.error)

    // if this fails w/e, it's in a bad state already
    await supabase.from('db_updates').upsert({
      script_id: scriptId,
      status: 'error',
      error_data: {
        error: `${lastUpdated.error}`,
      },
    })

    return
  }

  const updatedAt =
    lastUpdated.data.length > 0
      ? new Date(lastUpdated.data[0].last_success)
      : new Date('1776-07-04')

  console.log(
    `Processing votes, bills, and other motions for state data cache at ${cachePath}. Last DB update on ${updatedAt}`
  )

  const files = fs.readdirSync(`${cachePath}/actions`)

  const results: Record<ProcessVoteResult, number> = {
    [ProcessVoteResult.Updated]: 0,
    [ProcessVoteResult.NoChange]: 0,
    [ProcessVoteResult.Failed]: 0,
  }

  // votes are pretty immutable so
  let votesRecorded = 0

  for (const file of files) {
    try {
      const data = JSON.parse(
        fs.readFileSync(`${cachePath}/actions/${file}`).toString()
      ) as LegislatureAction

      const result = await processVote(data, updatedAt, sessionIds)

      results[result.action] += 1
      votesRecorded += result.votesRecorded
    } catch (e) {
      console.error(e)
      results[ProcessVoteResult.Failed] += 1
    }
  }

  console.log(`writing db last updated at`)

  // we actually want to record the time at which the cache was updated, not the time this script was run
  // because that's the actual time the data came in
  const cacheGenerationDate = JSON.parse(
    fs.readFileSync(`${cachePath}/cache_updated_at.json`).toString()
  ).updated_at

  const updateData: Record<string, any> = {
    script_id: scriptId,
    last_run: new Date(cacheGenerationDate),
    status: GlobalErrors.length > 0 ? 'error' : 'success',
    result_data: results,
    error_data: JSON.stringify({ errors: GlobalErrors }),
  }

  if (GlobalErrors.length === 0) {
    updateData.last_success = new Date(cacheGenerationDate)
  }

  const dbUpdate = await supabase.from('db_updates').upsert(updateData)

  if (dbUpdate.error) {
    console.error(dbUpdate.error)
  }

  console.log(`Update Complete
Success: ${results[ProcessVoteResult.Updated]}
Failed: ${results[ProcessVoteResult.Failed]}
Unchanged: ${results[ProcessVoteResult.NoChange]}
Votes Recorded: ${votesRecorded}
  `)

  // returns 0 if no errors, 1 otherwise
  return results[ProcessVoteResult.Failed] === 0 ? 0 : 1
}
