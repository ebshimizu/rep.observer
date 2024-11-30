/**
 * mostly a shim, though we do need the session ids and need to do a bit of formatting there
 */
import { getCurrentStateSessions, updateVotes } from '../dbUpdateStateVotes'

const cachePath = process.argv[2]

const sessionIds = await getCurrentStateSessions('CA')

// now CA session IDs are written as 'Assembly" or "Senate" and the cache is written as 'a' or 's'
await updateVotes(
  cachePath,
  { a: sessionIds.Assembly.id, s: sessionIds.Senate.id },
  'caUpdateBillData'
)
