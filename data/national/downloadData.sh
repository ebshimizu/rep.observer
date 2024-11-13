#!/bin/bash
node ./setCacheTimestamp.mjs

cd congress
usc-run govinfo --bulkdata=BILLSTATUS --congress=$1
usc-run bills --congress=$1
usc-run votes --congress=$1