#!/bin/bash
npx tsx ./setCacheTimestamp.ts

cd congress
usc-run govinfo --bulkdata=BILLSTATUS --congress=$1
usc-run bills --congress=$1
usc-run votes --congress=$1

cd ../
npx tsx ./generateCache.ts $1

npx tsx ./dbUpdateVotes.ts