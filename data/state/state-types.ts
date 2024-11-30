
/**
 * Session data.
 * Describes a session of congress. Includes data about the level and chamber.
 * Members serve terms in sessions.
 */
export interface StateSession {
	level: string
	state: string
	chamber?: string
	congress?: number
	title: string
	start_date: string
	end_date?: string
}

/**
 * Specific information about what the role of the member was during a session
 */
export interface StateTerm {
	state: string
	district: number
	party?: string
	/**
	 * The session index is not the session ID, but instead refers to the session in the specified position
	 * in the StateMemberCache.sessions array. This array will be resolved to actual session ID by
	 * a different script.
	 */
	sessionIndex: number
}

/**
 * State member data expected in the cache.
 * This is primarily biographical data for the given individual
 */
export interface StateMember {
	id: string
	full_name: string
	first_name: string
	last_name: string
	alt_name?: string
	homepage: string
	term: StateTerm
}

/**
 * Expected format for a members.json file in the corresponding state cache
 */
export type StateMemberCache = {
	sessions: StateSession[]
	members: Record<string, StateMember>
	lastUpdated: string
}

// TODO: unify these types with the national versions
export interface BillCosponsor {
  id: string
  original_cosponsor?: boolean
  sponsored_at?: string
  withdrawn_at?: string | null
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
  alternate_id: string
  source_url: string
  chamber: string
  congress?: number
  session?: number
  requires?: string
  number?: number
  question: string
  result: string
  result_text?: string
  date: string
  cache_updated_at: string
  type?: string
  rep_votes: Record<string, string>
}

export interface LegislatureAction {
  id: string
  type: string
  level: string
  state?: string
  chamber: string
  bill_type?: string
  congress?: number
  cosponsors?: BillCosponsor[]
  introduced_at?: string
  number?: number
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
