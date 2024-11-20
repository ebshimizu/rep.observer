/**
 * Retrieves representative data for the given rep.
 * Defaults to the info from the current session unless specified otherwise
 */

import { createClient } from '@supabase/supabase-js'
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

      let targetTerm =
        isTermUnfinished ??
        data.data.terms.sort(
          (a, b) =>
            new Date(b.sessions?.start_date ?? '').getTime() -
            new Date(a.sessions?.start_date ?? '').getTime()
        )[0]

      if ('session' in query) {
        // find the specified session id
        const targetId = parseInt(query.session as string)
        targetTerm = data.data.terms.find((t) => t.sessions?.id === targetId) as any
      }

      return {
        id: data.data.id,
        full_name: data.data.full_name,
        homepage: data.data.full_name,
        govtrack_id: data.data.govtrack_id,
        term: targetTerm,
      }
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'No representative found with given ID.'
  })
})
