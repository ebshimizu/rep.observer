// typescript interface definitions
export interface BillCosponsor {
  id: string
  original_cosponsor: boolean
  sponsored_at: string
  withdrawn_at: string | null
}

export interface BillAmendment {
  id: string
  type: string
  chamber: string
  congress: number
  number: number
  description: string
  introduced_at: string
  status: string
  status_at: string
  cache_updated_at: string
  sponsor: string
}

export interface Vote {
  id: string
  source_url: string
  chamber: string
  congress: number
  session: number
  requires: string
  number: number
  question: string
  result: string
  result_text: string
  date: string
  cache_updated_at: string
  type: string
  rep_votes: Record<string, string>
}

export interface NationalAction {
  id: string
  type: string
  level: string
  state?: string
  chamber: string
  bill_type?: string
  congress?: number
  cosponsors?: BillCosponsor[]
  introduced_at: string
  number: number
  official_title: string
  popular_title?: string
  short_title?: string
  sponsor_id?: string
  sponsor_type?: string
  status: string
  status_at: string
  tags?: string[]
  top_tag?: string
  summary?: Record<string, string>
  cache_updated_at: string
  source_url: string
  amendments?: BillAmendment[]
  votes: Vote[]
}

// --- these datatypes are derived from the congress python library's output files
// --- some types may be declared as `unknown` because I'm not actively using that data
export interface RawBillAction {
  acted_at: string
  action_code: string
  references: { reference: string; type: string }[]
  committees?: string[]
  text: string
  type: string
  bill_ids?: string[]
  how?: string
  result?: string
  roll?: string
  status?: string
  suspension?: string
  vote_type?: string
  where?: string
}

export interface RawBillAmendment {
  amendment_id: string
  amendment_type: string
  chamber: string
  number: string
}

export interface RawAmendment {
  amendment_id: string
  amendment_type: string
  amends_bill?: {
    bill_id: string
    bill_type: string
    congress: number
    number: number
  }
  chamber: string
  congress: string
  description: string
  introduced_at: string
  number: number
  purpose?: unknown
  sponsor: {
    bioguide_id: string
    district: string
    name: string
    state: string
    title: string
    type: string
  }
  status: string
  status_at: string
  updated_at: string
}

export interface RawBillCosponsor {
  bioguide_id: string
  district: string
  name: string
  original_cosponsor: boolean
  sponsored_at: string
  state: string
  title: string
  withdrawn_at: string | null
}

export interface RawRelatedBill {
  bill_id: string
  identified: string
  reason: string
  type: string
}

export interface RawBillData {
  actions: RawBillAction[]
  amendments: RawBillAmendment[]
  bill_id: string
  bill_type: string
  by_request: boolean
  // not looking at these
  committee_reports: unknown[]
  committees: unknown[]
  congress: string
  cosponsors: RawBillCosponsor[]
  enacted_as?: unknown
  history: unknown
  introduced_at: string
  number: string
  official_title: string
  popular_title?: string
  short_title?: string
  related_bills: RawRelatedBill[]
  sponsor: {
    bioguide_id: string
    district: string
    name: string
    state: string
    title: string
    type: string
  }
  status: string
  status_at: string
  subjects: string[]
  subjects_top_term: string
  summary: Record<string, string>
  titles: unknown[]
  updated_at: string
  url: string
}

export interface RawVoteMember {
  display_name: string
  id?: string
  party: string
  state: string
}

export interface BillReference {
  congress: number
  number: number
  type: string
}

export interface AmendmentReference {
  author: string
  number: number
  type: string
}

export interface RawVote {
  amendment?: AmendmentReference
  bill?: BillReference
  category: string
  chamber: string
  congress: number
  date: string
  number: number
  question: string
  requires: string
  result: string
  result_text: string
  session: string
  source_url: string
  type: string
  treaty?: {
    title: string
    // there are other things in here but w/e
  }
  nomination?: {
    title: string
    number: number
  }
  updated_at: string
  vote_id: string
  // votes use the result as the key, which maps to a list of members
  votes: Record<string, RawVoteMember[]>
}
