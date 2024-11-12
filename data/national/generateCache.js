// argument structure
// node ./generateCache.js [congress number]
const fs = require('fs-extra')

// assume we're running from '/data/national' right now
const dataDir = './congress/data'
const outDir = './cache'

// in-memory cache
// there isn't that much data so we can keep tracking things until the end to see what gets referenced repeatedly
// the vote data will embed the linked bill or other action info
const actionData = {}

const memberData = {}

// 118 = 2023-24
const congress = parseInt(process.argv[2])

const billDir = `${dataDir}/${congress}/bills`

const VoteResult = {
  SUCCESS: 'success',
  FAILURE: 'fail',
  SKIPPED: 'skip',
}

function getAmendment(amendment) {
  const amendmentPath = `${dataDir}/${congress}/amendments/${amendment.amendment_type}/${amendment.amendment_type}${amendment.number}/data.json`

  try {
    const data = JSON.parse(fs.readFileSync(amendmentPath))
    return {
      id: data.amendment_id,
      type: data.amendment_type,
      chamber: data.chamber,
      congress: data.congress,
      number: data.number,
      description: data.description,
      introduced_at: data.introduced_at,
      sponsor: data.sponsor.bioguide_id,
      status: data.status,
      status_at: new Date(data.status_at),
      cache_updated_at: new Date(data.updated_at),
    }
  } catch (e) {
    console.error(e)
    return amendment
  }
}

function getBillData(bill) {
  const billPath = `${billDir}/${bill.type}/${bill.type}${bill.number}/data.json`
  try {
    const data = JSON.parse(fs.readFileSync(billPath))

    const id = data.bill_id

    if (id in actionData) {
      //console.log(`[BILL] Bill ${data.bill_id} already in cache, returning`)

      return actionData[id]
    } else {
      actionData[id] = {
        id: data.bill_id,
        type: 'bill',
        level: 'national',
        state: null,
        chamber: data.bill_id[0], // starts with h or s so ...
        bill_type: data.bill_type,
        congress: parseInt(data.congress),
        cosponsors: data.cosponsors.map((c) => ({
          id: c.bioguide_id,
          original_cosponsor: c.original_cosponsor,
          sponsored_at: c.sponsored_at,
          withdrawn_at: c.withdrawn_at,
        })),
        introduced_at: data.introduced_at,
        number: data.number,
        official_title: data.official_title,
        popular_title: data.popular_title,
        short_title: data.short_title,
        sponsor_id: data.sponsor.bioguide_id,
        sponsor_type: data.sponsor.type,
        status: data.status,
        status_at: data.status_at,
        tags: data.subjects,
        top_tag: data.subjects_top_term,
        summary: data.summary,
        cache_updated_at: new Date(data.updated_at),
        source_url: data.url,
        amendments: data.amendments.map(getAmendment),
        votes: [],
      }

      // console.log(`[BILL] added ${data.bill_id} to bill cache`)
      return actionData[id]
    }
  } catch (e) {
    // console.log(`[ERROR] no file found for ${billPath}`)
    console.error(e)
  }
}

function getNominationData(voteData) {
  const id = `${voteData.chamber}n${voteData.nomination.number}-${voteData.congress}.${voteData.session}`
  if (id in actionData) {
    return actionData[id]
  } else {
    actionData[id] = {
      id,
      type: 'nomination',
      level: 'national',
      state: null,
      chamber: voteData.chamber,
      congress: voteData.congress,
      introduced_at: new Date(voteData.date),
      number: voteData.number,
      official_title: voteData.nomination.title,
      popular_title: voteData.nomination.title,
      short_title: voteData.nomination.title,
      status: voteData.result,
      status_at: new Date(voteData.date),
      cache_updated_at: new Date(voteData.updated_at),
      source_url: voteData.source_url,
      votes: [],
    }

    return actionData[id]
  }
}

function getTreatyData(voteData) {
  const id = `${voteData.chamber}t${voteData.number}-${voteData.congress}.${voteData.session}`
  if (id in actionData) {
    return actionData[id]
  } else {
    actionData[id] = {
      id,
      type: 'treaty',
      level: 'national',
      state: null,
      chamber: voteData.chamber,
      congress: voteData.congress,
      introduced_at: new Date(voteData.date),
      number: voteData.number,
      official_title: voteData.treaty.title,
      popular_title: voteData.treaty.title,
      short_title: voteData.treaty.title,
      status: voteData.result,
      status_at: new Date(voteData.date),
      cache_updated_at: new Date(voteData.updated_at),
      source_url: voteData.source_url,
      votes: [],
    }

    return actionData[id]
  }
}

function processVote(voteData) {
  // skip certain votes
  if (
    voteData.category === 'procedural' ||
    voteData.category === 'quorum' ||
    voteData.category === 'cloture' ||
    voteData.category === 'leadership'
  ) {
    // console.log(`[VOTE SKIP] ${voteData.vote_id} category is ${voteData.category}`)
    return VoteResult.SKIPPED
  }

  // convert to my format
  const repVotes = {}

  // format is the vote answer is the key, followed by array of who voted for that
  Object.entries(voteData.votes).forEach(([t, v]) => {
    v.forEach((member) => {
      repVotes[member.id] = t

      // cache the member data (idk if we need, there's a different source for that where we link the bioid)
      if (!(member.id in memberData)) {
        memberData[member.id] = member
      }
    })
  })

  const vote = {
    id: voteData.vote_id,
    source_url: voteData.source_url,
    chamber: voteData.chamber,
    congress: voteData.congress,
    session: parseInt(voteData.session),
    requires: voteData.requires,
    number: voteData.number,
    question: voteData.question,
    result_text: voteData.result_text,
    date: new Date(voteData.date),
    cache_updated_at: new Date(voteData.updated_at),
    type: voteData.type,
    result: voteData.result,
    rep_votes: repVotes,
  }

  // currently: just check if there's a linked bill (we'll add other data later)
  if ('bill' in voteData) {
    // collect the related bill
    const billData = getBillData(voteData.bill)

    if (billData) {
      billData.votes.push(vote)

      // console.log(`[VOTE] Processed vote for ${voteData.vote_id}`)
      return VoteResult.SUCCESS
    }
  } else if (voteData.category === 'nomination') {
    const nomData = getNominationData(voteData)

    if (nomData) {
      nomData.votes.push(vote)

      return VoteResult.SUCCESS
    }
  } else if (voteData.category === 'treaty') {
    const treatyData = getTreatyData(voteData)

    if (treatyData) {
      treatyData.votes.push(vote)

      return VoteResult.SUCCESS
    }
  }

  console.log(`[ERROR] unhandled category ${voteData.category}`)
  return VoteResult.FAILURE
}

function writeCacheToDisk(outPath) {
  // take the global cache and write it
  Object.entries(actionData).forEach(([id, d]) => {
    try {
      const file = `${outPath}/${id}.json`
      // console.log(
      //   `[OUT] writing ${file}, with ${d.votes.length} votes on record`
      // )

      fs.writeFileSync(file, JSON.stringify(d, null, 2))
    } catch (e) {
      console.error(e)
    }
  })

  fs.writeFileSync(
    `${outPath}/representatives.json`,
    JSON.stringify(memberData, null, 2)
  )
}

function generateDataCache() {
  // where are we lookin
  const dataRoot = `${dataDir}/${congress}`

  const outPath = `${outDir}/${congress}`

  // ensure exists
  try {
    fs.ensureDirSync(outPath)

    // votes
    const votesDir = `${dataRoot}/votes`
    // get the list of sessions (should be by year)
    const sessions = fs.readdirSync(votesDir)

    let yearIdx = 1
    let results = {
      [VoteResult.FAILURE]: 0,
      [VoteResult.SUCCESS]: 0,
      [VoteResult.SKIPPED]: 0,
    }
    let total = 0

    for (const year of sessions) {
      console.log(`Processing ${year} (${yearIdx} of ${sessions.length})`)
      const sessionDir = `${votesDir}/${year}`

      // list the votes
      const votes = fs.readdirSync(sessionDir)

      let voteIdx = 1

      console.log(`[${year}] Found ${votes.length} votes.`)
      total += votes.length

      for (const id of votes) {
        try {
          const file = `${sessionDir}/${id}/data.json`
          const data = JSON.parse(fs.readFileSync(file))

          // this will update the global cache
          const result = processVote(data)
          if (result === VoteResult.FAILURE) {
            console.log(
              `[Vote ${voteIdx} / ${votes.length}] ${data.vote_id} Result ${result}`
            )
          }

          results[result] += 1
        } catch (e) {
          console.error(e)
          results[VoteResult.FAILURE] += 1
        }

        voteIdx += 1
      }

      yearIdx = yearIdx + 1
    }

    console.log(
      `[VOTE] Success ${results[VoteResult.SUCCESS]}, fail ${
        results[VoteResult.FAILURE]
      }, skipped ${results[VoteResult.SKIPPED]}, total ${total}`
    )
    console.log('[OUT] writing data')
    writeCacheToDisk(outPath)
  } catch (e) {}
}

// it's 2023 we have top level await now if we need it
generateDataCache()
