import numberToWords from "number-to-words";
import moment from 'moment';

/**
 * Returns a title for the representative
 * @param level Representative level
 * @param chamber Representative's chamber
 * @returns Title given the inputs
 */
export function getTitle(level?: string | null, chamber?: string | null) {
  if (level === 'national') {
    return `${chamber}`
  }
}

export function getDistrictBadge(
  level?: string | null,
  district?: number | null,
  party?: string | null,
  state?: string | null
) {
  if (level === 'national') {
    const dist = district ? ` District ${district}` : ''
    return `${party?.charAt(0)}-${state}${district}`
  }
}

export function getSessionTitle(
  level?: string | null,
  congress?: number | null,
  date?: { start?: string | null; end?: string | null }
) {
  const dateStart = date?.start == null ? undefined : moment(date.start).format('MMMM Do YYYY')
  const dateEnd = date?.end == null ? 'Present' : moment(date.end).format('MMM< Do YYYY')

  const dateText = dateStart != null ? ` (${dateStart} to ${dateEnd})` : ''

  if (level === 'national') {
    return `${numberToWords.toOrdinal(congress ?? 1)} United States Congress${dateText}`
  }
}
