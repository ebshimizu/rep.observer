/**
 * returns the list of votes and subset of vote data for the specified member's session
 */

import { createClient } from '@supabase/supabase-js'
import { RepVotesResponse } from '~/utils/correctedDbTypes'

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

/** 
 * target query:
 * select
    *
  from
    public.rep_votes
    inner join public.votes on public.rep_votes.vote_id = public.votes.id
    and public.rep_votes.rep_id = 'param'
    and public.votes.session = param
    inner join public.actions on public.actions.id = public.votes.action_id
 */

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)

  const query = supabase
    .from('rep_votes')
    .select(
      `
    vote,
    votes (
      id,
      result,
      question,
      type,
      requires,
      number,
      date,
      actions (
        id,
        type,
        level,
        chamber,
        state,
        congress,
        bill_type,
        number,
        introduced_at,
        official_title,
        popular_title,
        short_title,
        sponsor_id,
        status,
        status_at,
        tags,
        top_tag,
        source_url,
        session_id
      )
    )
  `
    )
    .eq('rep_id', getRouterParam(event, 'repId'))

  if (queryParams.session != null) {
    query.eq('votes.session', parseInt(queryParams.session as string))
  }

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
    const typedData = data.data as unknown as RepVotesResponse[]

    const sorted = typedData.sort(
      (a, b) =>
        new Date(b.votes?.date ?? '').getTime() -
        new Date(a.votes?.date ?? '').getTime()
    )

    return sorted
  }
})
