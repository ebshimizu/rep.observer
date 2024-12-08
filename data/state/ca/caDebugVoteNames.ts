// this script is to help figure out how to effectively parse CA vote questions
// the vote type is encoded in the title but everything is put together with no separators
// meaning that I need to know what all the possible valid configurations of the votes are.
import fs from 'fs-extra'
import type { LegislatureAction } from '../state-types'

const files = fs.readdirSync(`./cache/2023/actions`)

/**
 * CA vote titles appear to be formatted in a very particular way
 * but they have no separators so this is kind of awful
 * @param question Vote question title
 */
function parseAssemblyVote(question: string) {
  // the following regex is just trying to grab the different bits of info from where they should be located in the title
  // this is pretty fragile, if CA ever changes how this data is rendered, we'll have to rewrite it
  const senateRegex =
    /(?<number>\w{2,3} \d{1,4}) (?<author>.*?) (?<type>Assembly Third Reading|Senate Third Reading|Consent Calendar(?: Second Day)?|Concurrence in Senate Amendments|Concurrence - Urgency Added|Third Reading Urgency|Motion to Reconsider)? ?(?<by>By [\w -\.,]+?)?(?<session>Second Day Regular Session|Second Extraordinary Session)?(?<amendment>(?:Amendment|Amend) .+)?$/gi

  const match = senateRegex.exec(question)

  if (match) {
    return {
      type: match.groups?.type,
      number: match.groups?.number,
      author: match.groups?.author.trim(),
      by: match.groups?.by,
      typeSuffix: match.groups?.typeSuffix,
      amendment: match.groups?.amendment,
      session: match.groups?.session
    }
  }
}

let parseFailures = 0
let parseSuccess = 0

for (const file of files) {
  const data = JSON.parse(
    fs.readFileSync(`./cache/2023/actions/${file}`).toString()
  ) as LegislatureAction

  for (const vote of data.votes) {
    if (vote.chamber === 'a') {
      const data = parseAssemblyVote(vote.question)

      if (data == undefined) {
        parseFailures += 1
        console.log(`[Parse failed] ${vote.question}`)
      } else {
        parseSuccess += 1
      }
    }
  }
}

console.log(
  `Parsed ${parseSuccess} / ${
    parseFailures + parseSuccess
  }. Remaining: ${parseFailures}`
)
