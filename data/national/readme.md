# US National Congressional Record Fetching

## Setup
This project uses `unitedstates/congress` to fetch data in json format. The json files are then parsed and ingested into a relational database for display via the web front-end.

If you are working on windows, you should use WSL to run the scripts in this folder.

### Development notes
Initializing the data cache
```
usc-run govinfo --bulkdata=BILLSTATUS
usc-run bills
usc-run votes
```

## Reformatting the data
We're interested in sorting things here by the list of bills/resolutions/actions and then mapping representative votes to those actions. Each piece of legislation goes through multiple revisions and votes, so we'll need to track what was voted on when.

### Uploading to database

### Refreshing the data
we'll need some way to track last time something changed to keep our data in sync