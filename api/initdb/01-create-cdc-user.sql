-- Runs once, only when the Postgres data directory is first initialized (empty volume).
-- Creates a least-privilege role for Ventstream's CDC connection (search/docker-compose.yml),
-- instead of reusing the POSTGRES_USER superuser.
--
\getenv cdc_user CDC_USER
\getenv cdc_password CDC_PASSWORD

CREATE ROLE :"cdc_user" WITH LOGIN REPLICATION PASSWORD :'cdc_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"cdc_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"cdc_user";

-- Empty on purpose: this runs before the app's migrations (api/src), so the tables that
-- should actually be in scope (answer, comment, question, question_tag, tag - never
-- answer_medals, session, or "user") don't exist yet. search/scripts/backfill.sh adds
-- them once the app has migrated - see search/README.md.
CREATE PUBLICATION zine_publication;
