/**
 * returns the list of votes and subset of vote data for the specified member's session
 */

import { createClient } from '@supabase/supabase-js'

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
  const data = await supabase
    .from('rep_votes')
    .select(
      `
    vote,
    votes (
      result,
      question,
      type,
      requires,
      number,
      date,
      actions (
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
    .eq('votes.session', parseInt(getRouterParam(event, 'session') ?? '0'))

  if (data.error) {
    console.error(data.error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Query failed to return data',
    })
  } else {
    return data.data
  }
})
