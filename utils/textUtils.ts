import numberToWords from "number-to-words";
import moment from 'moment';

/**
 * Returns a title for the representative
 * @param level Representative level
 * @param chamber Representative's chamber
 * @returns Title given the inputs
 */
export function getTitle(level?: string | null, chamber?: string | null, state?: string | null) {
  if (level === 'national') {
    return `${chamber}`
  } else if (level === 'state') {
    return `${state} State ${chamber}`
  }
}

export function getDistrictBadge(
  level?: string | null,
  district?: number | null,
  party?: string | null,
  state?: string | null
) {
  if (level === 'national') {
    const dist = district != null ? ` District ${district}` : ''
    return `${party?.charAt(0)}-${state}${dist}`
  } else if (level === 'state') {
    const dist = district != null ? `District ${district} ` : ''
    return `${party?.charAt(0)}-${state} State ${dist}`
  }
}

export function getSessionTitle(
  level?: string | null,
  congress?: number | null,
  date?: { start?: string | null; end?: string | null },
  title?: string | null
) {
  const dateStart = date?.start == null ? undefined : moment(date.start).format('MMMM Do YYYY')
  const dateEnd = date?.end == null ? 'Present' : moment(date.end).format('MMMM Do YYYY')

  const dateText = dateStart != null ? ` (${dateStart} to ${dateEnd})` : ''

  if (level === 'national') {
    return `${numberToWords.toOrdinal(congress ?? 1)} United States Congress${dateText}`
  } else {
    return `${title}`
  }
}

export const VotePassedLabels = [
  'pass',
  'passed',
  'nomination confirmed',
  'cloture motion agreed to',
  'bill passed',
  'motion agreed to',
  'joint resolution passed',
  'cloture on the motion to proceed agreed to',
  'veto sustained',
  'conference report agreed to',
  'amendment agreed to',
  'resolution agreed to',
  'resolution of ratification agreed to'
]

export const VoteFailedLabels = [
  'fail',
  'failed',
  'cloture motion rejected',
  'cloture on the motion to proceed rejected',
  'amendment rejected',
  'bill defeated',
  'motion rejected',
  'joint resolution defeated'
]

/**
 * Returns the color of the badge label (as a string) according to the vote result.
 * The senate specifically has a lot of these labels so I'll try to keep up
 * @param res vote result string to check
 * @returns 
 */
export function voteResultColor(res: string) {
  if (VotePassedLabels.includes(res)) {
    return 'green'
  } else if (VoteFailedLabels.includes(res)) {
    return 'red'
  }
}