/**
 * corrected response type for the /rep/[repId]/votes endpoint
 */
export interface RepVotesResponse {
  vote: string
  votes: {
    result?: string
    question?: string
    type?: string
    requires?: string
    number?: number
    date?: string
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
