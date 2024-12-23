/**
 * returns a list of representatives given the list of IDs in the query
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

  const dbQuery = supabase.from('representatives').select(`
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
    )`)

  if ('ids' in query) {
    dbQuery.in('id', Array.isArray(query.ids) ? query.ids : [query.ids])
  }

  const data = await dbQuery

  if (data.error) {
    console.error(data.error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Query failed to return data',
    })
  } else {
    // get most recent term
    const formatted = data.data.map((r) => {
      const isTermUnfinished = r.terms.find((t) => t.sessions?.end_date == null)

      const sortedTerms = r.terms.sort(
        (a, b) =>
          new Date(b.sessions?.start_date ?? '').getTime() -
          new Date(a.sessions?.start_date ?? '').getTime()
      )

      let currentTerm = isTermUnfinished ?? sortedTerms[0]

      return {
        id: r.id,
        full_name: r.full_name,
        homepage: r.homepage,
        govtrack_id: r.govtrack_id,
        currentTerm,
      } as unknown as RepInfoResponse
    })

    return formatted
  }
})
