# California

## Data Sources
- Members
  - Assembly
	- Senate
- Votes and Bills

### CA Notes
CA does actually provide sql exports of their entire database, however these are in bulk drops or in incremental packages relative to their own DB schema. I'm also not sure I want to rely on that particular process staying active, so we'll treat the web page front end as the source of truth and extract data from there.