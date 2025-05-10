import { createClient } from '@supabase/supabase-js'
import type { StateMemberCache } from './state-types'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') })

const supabase = createClient(
  process.env.NUXT_SUPABASE_DB_URL ?? '',
  process.env.NUXT_SUPABASE_KEY ?? ''
)

/**
 * given a member id, check if it's a valid unique id. if not, this function will correct the id and return it
 */
export async function validateIdUnique(id: string, full_name: string, memberData: StateMemberCache['members']) {
  // TODO: Database check here to get full ID
  // get the database duplicates
  const query = await supabase
    .from('representatives')
    .select('*')
    .like('id', `${id}%`)

  // check if there's an exact match in the query. An exact match is when the id and full name are the same
  const exactMatch = query.data?.find(
    (d) => d.id === id && d.full_name.toLowerCase() === full_name.toLowerCase()
  )

  if (exactMatch) {
    console.log(`[ID] Exact match found for ${id} (${full_name})`)
    return exactMatch.id
  }

  // check if there's a likely match (full names are identical)
  // this will be returned with a log warning to do a check
  const likelyMatch = query.data?.find(
    (d) => d.full_name.toLowerCase() === full_name.toLowerCase()
  )

  if (likelyMatch) {
    console.log(
      `[ID VERIFICATION NEEDED] Likely match ${likelyMatch.id} found for ${full_name}, manually check that this is the same person.`
    )
    return likelyMatch.id
  }

  // if there's no match and a duplicate, combine local and remote list of dupes to get a unique suffix
  const possibleLocalDupes = Object.keys(memberData).filter((k) =>
    k.startsWith(id)
  )
  const dupCount = possibleLocalDupes.length + (query.data?.length ?? 0)

  if (dupCount > 0) {
    // make a new one
    const newId = `${id}${dupCount + 1}`
    console.log(
      `id conflict found in cache and database, adjusting ${id} => ${newId}`
    )
    return newId
  }

  return id
}