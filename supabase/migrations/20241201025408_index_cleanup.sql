alter table "public"."bill_amendments" drop constraint "bill_amendments_action_id_fkey";

alter table "public"."bill_cosponsors" drop constraint "bill_cosponsors_action_id_fkey";

alter table "public"."votes" drop constraint "votes_action_id_fkey";

alter table "public"."actions" drop constraint "actions_id_key";

drop index if exists "public"."actions_id_key";

alter table "public"."bill_amendments" add constraint "bill_amendments_action_id_fkey" FOREIGN KEY (action_id) REFERENCES actions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."bill_amendments" validate constraint "bill_amendments_action_id_fkey";

alter table "public"."bill_cosponsors" add constraint "bill_cosponsors_action_id_fkey" FOREIGN KEY (action_id) REFERENCES actions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."bill_cosponsors" validate constraint "bill_cosponsors_action_id_fkey";

alter table "public"."votes" add constraint "votes_action_id_fkey" FOREIGN KEY (action_id) REFERENCES actions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."votes" validate constraint "votes_action_id_fkey";


