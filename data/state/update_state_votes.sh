#!/bin/bash
cd ./ca
npx tsx ./caGetBillData.ts
npx tsx ./caUpdateBillData.ts ./cache/2025