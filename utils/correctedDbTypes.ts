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