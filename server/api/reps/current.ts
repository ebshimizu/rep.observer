/**
 * returns the list of current representatives.
 * this mostly returns the rows of the specified view, which has been pre-defined in the database
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '~/utils/supabase-types'
import { CurrentRepEntry } from '../../../utils/correctedDbTypes'

const supabase = createClient<Database>(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const dbQuery = supabase.from('current_reps').select('*')

  if ('search' in query) {
    dbQuery.ilike('full_name', `%${query.search as string}%`)
  }

  if ('level' in query) {
    dbQuery.eq('level', `${query.level as string}`)
  }

  if ('state' in query) {
    dbQuery.eq('state', `${query.state as string}`)
  }

  const data = await dbQuery

  if (data.error) {
    console.error(data.error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Query failed to return data',
    })
  } else {
    return data.data as unknown as CurrentRepEntry[]
  }
})
