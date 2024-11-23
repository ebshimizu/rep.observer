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