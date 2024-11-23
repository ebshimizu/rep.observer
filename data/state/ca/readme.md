# California

## Data Sources
- Members
  - Assembly - https://www.assembly.ca.gov/assemblymembers
	- Senate - https://www.senate.ca.gov/senators
- Votes and Bills - https://leginfo.legislature.ca.gov/faces/home.xhtml

### CA Notes
CA does actually provide sql exports of their entire database, however these are in bulk drops or in incremental packages relative to their own DB schema. I don't really want to run a second DB to get this data so we're just going to the local file approach like the congress python library does.
