import { toOrdinal } from "number-to-words";

const BillTypeMap: Record<string, string> = {
  'hr': 'house-bill',
  's': 'senate-bill',
  'hres': 'house-resolution',
  'sres': 'senate-resolution',
  'hjres': 'house-joint-resolution',
  'sjres': 'senate-joint-resolution',
  'hconres': 'house-concurrent-resolution',
  'sconres': 'senate-concurrent-resolution'
}

export function getCongressUrl(congress: number, type: string, number: number) {
  if (type in BillTypeMap) {
    const congressSlug = `${toOrdinal(congress)}-congress`
    const typeSlug = BillTypeMap[type]

    return `https://congress.gov/bill/${congressSlug}/${typeSlug}/${number}`
  }

  return undefined

}