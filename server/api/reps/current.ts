/**
 * returns the list of current representatives.
 * this mostly returns the rows of the specified view, which has been pre-defined in the database
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

export default defineEventHandler(async (event) => {
  const data = await supabase.from('current_reps').select('*')

  if (data.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Query failed to return data'
    })
  } else {
    return data.data
  }
})