# State Data Parsers

Currently Supported:
- CA

## Adding New States
To support a new state, the following data must be collected:
- Legislator information (with globally unique IDs)
- Session information
- Vote information (associated with particular bills or other actions)

We accomplish this by first parsing all of the data from the various state websites into a standardized format that our top-level state update scripts can handle. Provided that each state formats the data appropriately, this should allow us to use a set of standard database update scripts, just directed at different cache folders, to update the data.

States must provide a `update.ts` script that will update the cache and then load the cache data in to the database. Scripts in the state folders can reference scripts at the top level for repetitive tasks. Assuming each state puts data into their caches in the same way, the top level scripts should be cross-compatible with each state's cache.

### Representatives
The tricky part about the representative data scrapers is generating a globally unique ID for each member. Generally, each state can choose how they want to do this. Database checks are allowed in these scripts to let scripts determine how to handle conflicts or find duplicate members from session to session.

This gets even more complicated when someone moves from the state level to national level (or i guess back to state level? does that happen?). In this case we may need to do some manual data linking. A script will eventually be made available to perform ID merging automatically (mostly an issue of updating all referenced foreign keys and then deleting the original row).

Steps for importing representative data:
1. Write a cache file. Use `./ca/caGetRepData.ts` as a template.
2. Once the cache file gets generated, copy it to a folder labeled `rep_data` in the state folder. Name the cache file something descriptive and relevant to the relevant legislative session. This data doesn't change that often and sometimes requires manual adjustments, so we maintain a persistent cache of the representative data.
3. Write a database upload script. Use `./ca/caUpdateRepData.ts` as a template. The argument given to this script should be the file path to a json file in `rep_data` for your state.

## State Data Update Runbook
Individual state runbooks are within their folders. Check each folder for recovery steps.

The nightly script `./update_state_votes.sh`, which might get split in to different timezone updates at some point. This script should be run from this folder (`/data/state`) and will handle all of the update steps for the current legislative session.

### Updating for the next year
All state representative data must be manually generated and updated. Hopefully this is a mostly automatic step, but some states (Texas) need manual adjustments to reconcile IDs and populate party data. Check each folder for details.