# US National Congressional Record Fetching

## Setup
This project uses `unitedstates/congress` to fetch data in json format. The json files are then parsed and ingested into a relational database for display via the web front-end.

If you are working on windows, you should use WSL to run the scripts in this folder.

## Updating the Data

### First Run
The representatives need to be in the database before the votes go in, so when you're running this script for the first time, you will need to first update the cache and update the representatives data in the database.

Run the following commands for first run from the `/data/national` folder.
```
./update_partial.sh [current congress number, 118]
npx tsx ./generateCache.ts [current congress number, 118]
npx tsx ./dbUpdateReps.ts [current congress number, 118]
npx tsx ./dbUpdateVotes.ts
```

### Normal Updates
After running the initial representative data generation, you can just run `./update.sh` to load updated votes and bills.

If there's a new representative in the data, an error should show up in the script. (TODO: when this error happens, attempt a representative data update).
