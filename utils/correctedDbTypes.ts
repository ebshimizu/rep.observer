/**
 * corrected response type for the /rep/[repId]/votes endpoint
 */
export interface RepVotesResponse {
  vote: string
  votes: {
    id: string
    result?: string
    question?: string
    type?: string
    requires?: string
    number?: number
    date?: string
    alternate_id?: string
    actions: {
      id: string
      type?: string
      level?: string
      chamber: string
      congress?: number
      bill_type?: string
      number?: number
      introduced_at?: string
      official_title?: string
      popular_title?: string
      short_title?: string
      sponsor_id?: string
      status?: string
      status_at?: string
      tags?: string[]
      top_tag?: string
      source_url?: string
      session_id: number
    }
  }
}

export type ActionRepVotesResponse = {
  id: string
  action_id: string
  result?: string
  question?: string
  type?: string
  chamber?: string
  congress?: number
  session: number
  requires?: string
  number?: number
  date: string
  alternate_id?: string
  rep_votes: {
    vote: string
    rep_id: string
  }[]
}[]

export type SessionTruncated = {
  sessions: {
    id: string
    end_date: string
    start_date: string
  }
}

export type RepInfoTerm = {
  state?: string
  district?: number
  party?: string
  sessions: {
    id: number
    level: string
    state?: string
    chamber?: string
    congress?: number
    title?: string
    start_date?: string
    end_date?: string
  }
}

export type RepInfoResponse = {
  id: string
  full_name: string
  homepage?: string
  govtrack_id?: string
  currentTerm: RepInfoTerm
  terms: RepInfoTerm[]
}

export type CurrentRepEntry = {
  chamber: string | null
  congress: number | null
  district: number | null
  full_name: string | null
  level: string | null
  party: string | null
  rep_id: string | null
  session_id: number | null
  state: string | null
  title: string | null
}
