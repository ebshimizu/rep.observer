/**
 * returns the action details and all of the relevant votes performed by the target representative
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

export default defineEventHandler(async (event) => {
  const query = supabase
    .from('actions')
    .select(
      `*,
        votes (
          id,
          created_at,
          result,
          question,
          type,
          chamber,
          congress,
          session,
          requires,
          number,
          date,
          alternate_id,
          rep_votes (
            rep_id,
            vote
          )
        )`
    )
    .eq('id', getRouterParam(event, 'actionId'))
    .eq('votes.rep_votes.rep_id', getRouterParam(event, 'repId'))

  const data = await query

  if (data.error) {
    console.error(data.error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Query failed to return data',
    })
  } else {
    // the default order is vote date descending. the client can choose to change this, but the server
    // returns all vote data
    return data.data
  }
})
