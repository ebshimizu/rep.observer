/**
 * Retrieves representative data for the given rep.
 * Defaults to the info from the current session unless specified otherwise
 */

import { createClient } from '@supabase/supabase-js'
import { RepInfoResponse } from '~/utils/correctedDbTypes'
import { Database } from '~/utils/supabase-types'

const supabase = createClient<Database>(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const repId = getRouterParam(event, 'repId')

  if (repId) {
    const dbQuery = supabase
      .from('representatives')
      .select(
        `
    id,
    full_name,
    homepage,
    govtrack_id,
    terms (
      state,
      district,
      party,
      sessions (
        id,
        level,
        state,
        chamber,
        congress,
        title,
        start_date,
        end_date
      )
    )
  `
      )
      .eq('id', repId)
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
      const isTermUnfinished = data.data.terms.find(
        (t) => t.sessions?.end_date == null
      )

      const sortedTerms = data.data.terms.sort(
        (a, b) =>
          new Date(b.sessions?.start_date ?? '').getTime() -
          new Date(a.sessions?.start_date ?? '').getTime()
      )

      let currentTerm = isTermUnfinished ?? sortedTerms[0]

      return {
        id: data.data.id,
        full_name: data.data.full_name,
        homepage: data.data.homepage,
        govtrack_id: data.data.govtrack_id,
        terms: sortedTerms,
        currentTerm,
      } as unknown as RepInfoResponse
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No representative found with given ID.',
  })
})
