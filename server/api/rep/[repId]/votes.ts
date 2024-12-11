/**
 * returns the list of votes and subset of vote data for the specified member's session
 */

import { createClient, Session } from '@supabase/supabase-js'
import { RepVotesResponse, SessionTruncated } from '~/utils/correctedDbTypes'

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
  console.log(queryParams)

  const query = supabase
    .from('rep_votes')
    .select(
      `
    vote,
    votes!inner (
      id,
      result,
      question,
      type,
      requires,
      number,
      date,
      alternate_id,
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
  } else {
    // we default limit to the current session. Determining this requires another database request
    const dbQuery = supabase
      .from('representatives')
      .select(
        `
          id,
          terms (
            sessions (
              id,
              start_date,
              end_date
            )
          )
        `
      )
      .eq('id', getRouterParam(event, 'repId'))
      .limit(1)
      .single()

    const data = await dbQuery

    if (data.error) {
      console.error(data.error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Query failed to return data',
      })
    } else {
      // get the most recent term
      const terms = data.data.terms as unknown as SessionTruncated[]
      const isTermUnfinished = terms.find(
        (t) => t.sessions?.end_date == null
      )

      const sortedTerms = terms.sort(
        (a, b) =>
          new Date(b.sessions?.start_date ?? '').getTime() -
          new Date(a.sessions?.start_date ?? '').getTime()
      )

      let currentTerm = isTermUnfinished ?? sortedTerms[0]
      query.eq('votes.session', currentTerm.sessions?.id)
    }
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
