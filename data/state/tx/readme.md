# Texas Data Parser Runbook

## Representatives
Texas needs more care than most when fetching the representatives.

Make sure your console is logging properly and initialize cache with
```bash
npx tsx ./txGetRepData [year]
```

Copy the cache file to `./rep_data`, rename with the Texas Legislature session number (2025's session was 89).

Check the file for any inconsistent IDs (i.e. html codes that snuck in) and fix them. Next, check the log for any line that starts with [MANUAL CORRECTION NEEDED]. This indicates that the script did not locate a party identifier for the given representative due to a name formatting mismatch. You'll need to visit `https://www.lrl.texas.gov/legeLeaders/members/partyListSession.cfm?leg=[session number]` to resolve the party affiliation. Manually correct the cache file in `rep_data` and commit the result.

Update the database with
```bash
npx tsx ./txUpdateRepData [path to cache file]
```

## Votes
```
npx tsx ./txGetBillData [session number] [-v] [-i]
```
- session number instead of year
- `-i` runs the script in incremental mode (only download changes seen in the history.xml file in the ftp root)
- `-v` enables verbose FTP output. Not recommended for production.