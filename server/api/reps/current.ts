/**
 * returns the list of current representatives.
 * this mostly returns the rows of the specified view, which has been pre-defined in the database
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '~/utils/supabase-types'

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

  const data = await dbQuery

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
