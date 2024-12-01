create or replace view "public"."current_sessions"
  with (security_invoker=on)
  as  SELECT sessions.id,
    sessions.level,
    sessions.state,
    sessions.chamber,
    sessions.congress,
    sessions.title,
    sessions.start_date,
    sessions.end_date
   FROM sessions
  WHERE (sessions.end_date IS NULL);


create or replace view "public"."current_reps"
  with (security_invoker=on)
  as  SELECT terms.rep_id,
    terms.session_id,
    terms.state,
    terms.district,
    terms.party,
    representatives.full_name,
    current_sessions.chamber,
    current_sessions.congress,
    current_sessions.level,
    current_sessions.title
   FROM ((terms
     JOIN current_sessions ON ((terms.session_id = current_sessions.id)))
     JOIN representatives ON ((terms.rep_id = representatives.id)));



