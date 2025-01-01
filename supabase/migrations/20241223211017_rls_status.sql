drop index if exists "public"."rep_votes_rep_id_idx";

create policy "Enable read access for all users"
on "public"."db_updates"
as permissive
for select
to public
using (true);



