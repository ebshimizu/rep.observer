/**
 * mostly just a shim for the global update file
 */

import { processRepData } from '../dbUpdateStateReps'

await processRepData(`./${process.argv[2]}`, 'caUpdateRepData')
