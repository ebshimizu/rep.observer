// this is the big one
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })

import fs from 'fs-extra'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_DB_URL,
  process.env.SUPABASE_KEY
)

const SCRIPT_ID = 'national-votes'

/**
 *
 * @param {*} data Bill data
 * @param {Date} dbUpdatedAt the last time this script ran successfully
 * @param {{ h: number, s: number }} sessionId House and senate session ids (maps to sessions table)
 * @returns {{ bill: string, votesRecorded: number }} Object representing status
 */
async function processVote(data, dbUpdatedAt, sessionId, congress) {
  // check the cache time for the action. If the
  const returnData = {
    action: 'failed',
    votesRecorded: 0,
  }

  try {
    // bill data update
    const updatedAt = new Date(data.cache_updated_at)
    if (updatedAt < dbUpdatedAt) {
      returnData.action = 'noChange'
    } else {
      console.log(
        `[${data.id}] Processing updated data (${data.cache_updated_at})`
      )
      // do the update
      // this is mostly an upsert where we just overwrite what's there, though the summary has to be jsonified
      // first, write the action data
      const actionResult = await supabase.from('actions').upsert({
        id: data.id,
        type: data.type,
        level: data.level,
        chamber: data.chamber,
        session_id: sessionId[data.chamber],
        congress,
        bill_type: data.bill_type,
        number: parseInt(data.number),
        official_title: data.official_title,
        popular_title: data.popular_title,
        short_title: data.short_title,
        sponsor_id: data.sponsor_id,
        sponsor_type: data.sponsor_type,
        status: data.status,
        status_at: new Date(data.status_at),
        tags: data.tags,
        top_tag: data.top_tag,
        summary: JSON.stringify(data.summary),
        cache_updated_at: new Date(data.cache_updated_at),
        source_url: data.source_url,
      })

      if (actionResult.error) {
        returnData.action = 'failed'
        console.error(actionResult.error)
        return returnData
      }

      console.log(`[${data.id}] Action data updated`)

      // update amendments
      const amendments = data?.amendments ?? []
      console.log(`[${data.id}] Updating ${amendments.length} amendments`)

      for (const amendment of amendments) {
        const amendmentUpdated = new Date(amendment.cache_updated_at)

        if (amendmentUpdated > dbUpdatedAt) {
          console.log(`[${data.id}] Updating amendment ${amendment.id}`)

          // amendments have unique keys here so this should be just an update/insert
          const amendmentResult = await supabase
            .from('bill_amendments')
            .upsert({
              id: amendment.id,
              action_id: data.id,
              type: amendment.type,
              chamber: amendment.chamber,
              congress,
              number: amendment.number,
              description: amendment.description,
              introduced_at: new Date(amendment.introduced_at),
              sponsor_id: amendment.sponsor,
              status: amendment.status,
              status_at: new Date(amendment.status_at),
              cache_updated_at: new Date(amendment.cache_updated_at),
            })

          if (amendmentResult.error) {
            console.error(amendmentResult.error)
            returnData.action = 'failed'
            return returnData
          }
        }
      }

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
            sponsored_at: new Date(c.sponsored_at),
            withdrawn_at:
              c.withdrawn_at == null ? null : new Date(c.withdrawn_at),
          }))
        )

        if (result.error) {
          console.error(result.error)
          returnData.action = 'failed'
          return returnData
        }
      }

      returnData.action = 'updated'
    }

    // check the votes
    for (const vote of data.votes) {
      // votes don't actually update after they're taken (usually)
      // which seems like an obvious thing to write BUT
      const voteUpdatedAt = new Date(vote.date)

      if (voteUpdatedAt > dbUpdatedAt) {
        console.log(`[${data.id}] updating vote ${vote.id}`)

        // we're going to use the alternate_id field here to quickly insert stuff
        const voteResult = await supabase.from('votes').upsert(
          {
            alternate_id: vote.id,
            action_id: data.id,
            result: vote.result,
            question: vote.question,
            type: vote.type,
            chamber: vote.chamber,
            congress: vote.congress,
            session: sessionId[vote.chamber],
            requires: vote.requires,
            number: vote.number,
            date: new Date(vote.date),
            cache_updated_at: new Date(vote.cache_updated_at),
          },
          {
            onConflict: 'alternate_id',
          }
        )

        if (voteResult.error) {
          console.error(voteResult.error)
          returnData.action = 'failed'
          // ... eh not the best error handling but oh well at least it logs
          return returnData
        }

        // retrieve the id of the thing we just inserted
        const voteEntry = await supabase.from('votes').select('id').eq('alternate_id', vote.id)

        if (voteEntry.error) {
          console.error(voteResult.error)
          returnData.action = 'failed'
          return returnData
        }
        
        const voteRecordId = voteEntry.data[0].id

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
          returnData.action = 'failed'
          return returnData
        }

        console.log(
          `[${data.id}] Recorded votes for ${vote.id}`
        )
        returnData.votesRecorded += 1
      }
    }
  } catch (e) {
    console.error(e)
    returnData.action = 'failed'
    return returnData
  }

  return returnData
}

async function processVotes() {
  // we do this based on the current info in the database
  // so first, we get what the most recent session is for the house and senate
  // this is actually the national level column with end_date null
  const currentHouseSession = await supabase
    .from('sessions')
    .select('*')
    .eq('level', 'national')
    .eq('chamber', 'House of Representatives')
    .is('end_date', null)

  const currentSenateSession = await supabase
    .from('sessions')
    .select('*')
    .eq('level', 'national')
    .eq('chamber', 'Senate')
    .is('end_date', null)

  if (currentHouseSession.error || currentSenateSession.error) {
    console.error('Unable to update votes, current session not found')
    console.error(currentHouseSession.error, currentSenateSession.error)
    return
  }

  const congress = currentHouseSession.data[0].congress
  const hSid = currentHouseSession.data[0].id
  const sSid = currentSenateSession.data[0].id

  // retrieve the last updated data from the db
  const lastUpdated = await supabase
    .from('db_updates')
    .select('*')
    .eq('script_id', SCRIPT_ID)

  if (lastUpdated.error) {
    console.error('Unable to retrieve database last updated at data')
    console.error(lastUpdated.error)
    return
  }

  const updatedAt =
    lastUpdated.data.length > 0
      ? new Date(lastUpdated.data[0].last_run)
      : new Date('1776-07-04')

  console.log(
    `Processing votes, bills, and other motions for national congress ${congress}. Last DB update on ${updatedAt}`
  )

  // DEBUG: Testing one file first so i can revert DB when necessary
  const files = fs.readdirSync(`./cache/${congress}`)

  const results = {
    updated: 0,
    failed: 0,
    noChange: 0,
  }

  // votes are pretty immutable so
  let votesRecorded = 0

  for (const file of files) {
    try {
      // i have one special file in the cache that we should skip
      if (file === 'representatives.json') continue

      const data = JSON.parse(fs.readFileSync(`./cache/${congress}/${file}`))
      const result = await processVote(
        data,
        updatedAt,
        { h: hSid, s: sSid },
        congress
      )

      results[result.action] += 1
      votesRecorded += result.votesRecorded
    } catch (e) {
      console.error(e)
      results.failed += 1
    }
  }

  console.log(`writing db last updated at`)
  
  // we actually want to record the time at which the cache was updated, not the time this script was run
  const cacheGenerationDate = JSON.parse(fs.readFileSync('./cache/cache_updated_at.json')).updated_at
  const dbUpdate = await supabase.from('db_updates').upsert({
    script_id: SCRIPT_ID,
    last_run: new Date(cacheGenerationDate),
    status: 'success'
  })

  if (dbUpdate.error) {
    console.error(dbUpdate.error)
  }

  console.log(`Update Complete
- Success: ${results.updated}
- Failed: ${results.failed}
- Unchanged: ${results.noChange}
- Votes Recorded: ${votesRecorded}
  `)
}

// run the script
await processVotes()
