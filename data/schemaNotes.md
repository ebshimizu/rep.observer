# notes on schema

we're interested in what the representatives are doing and what their actions were on the following categories:
- bills (including amendment voting)
- nominations
- treaties (national level)

these are the things that generally get house/senate votes.

We'll want to organize the data around the actions on these pieces of data, focusing on bills.

what we want
- when we go to a representative' page, we get the list of legislation that was voted on during the specified session.
- we then query the database to get the bills/actions that occurred (paginated probably) and then fetch all of the representative's votes for each action. this is a couple levels deep: a bill has one or more votes and votes have one or more vote records
  - conceptually i want "resolutions with most recent vote and most recent vote result for representative" which feels achievable with relational dbs

## Resolutions
- id
- type (bill, nomination, treaty, etc.)
- level
- state
- municipality
- congress
- chamber
- number
- session
- status
- title
- description
- external_link
- category
- tags
- regional level data can either be added here or in a side table that gets joined with a view

## Votes
Votes are a specific action taken on a bill or other resolution

- id
- bill (foreign key)
- type
- chamber
- question
- requires
- result
- date
- external_link
- category

## Vote Record
A vote record is a record of an individual representative's vote on a given issue.

- id
- representative (foreign key)
- resolution (foreign key)
- bill (foreign key)
- date
- type
- vote (aye, nay, absent, something else?)

## Representative
- id
- level
- state
- municipality
- district
- display_district
- bioid (national)
- photo
- website
- contact_email
- contact_phone
- congress
- sessions (array? need to track which sessions each rep is part of?)

## Session
congressional session? to track which data to show in the index?

## User-Annotations
we also want to be able to cross-reference the actions a rep takes with campaign promises. These must be user entered, so we'll also need a scheme to support user generated content.

### campaign_promise
can't just call "promise" to avoid conflict with javascript promise concept.

- id
- representative (foreign_key)
- category
- tags
- title
- summary
- fulfilled

Every promise must have at least one public source

### promise_source
- id
- promise (foreign_key)
- url
- archive_url
- retrieved_on

### promise_action
Did the rep actually take action? we should be able to mark specific actions here.

- id
- promise (foreign_key)
- bill/vote/vote record (foreign_key)?

### submission_queue
if we eventually have a team of people managing this data, we'll need to have a system for handling submissions, or we'll just have moderators for each state