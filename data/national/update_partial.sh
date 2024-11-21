#!/bin/bash
# script just for the congress part because i have a weird windows setup for dev
cd ./congress
usc-run govinfo --bulkdata=BILLSTATUS --congress=$1
usc-run bills --congress=$1
usc-run votes --force --congress=$1