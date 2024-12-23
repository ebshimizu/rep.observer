/**
 * Retrieves the script status from the database updates table
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '~/utils/supabase-types'

const supabase = createClient<Database>(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

export default defineEventHandler(async (event) => {
  const dbQuery = supabase.from('db_updates').select(`
    script_id,
    last_run,
    status,
    last_success`
  )

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
