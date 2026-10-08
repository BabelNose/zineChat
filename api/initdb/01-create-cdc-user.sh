#!/bin/bash
# Runs once, only when the Postgres data directory is first initialized (empty volume).
# Creates a least-privilege role for Debezium's CDC connection, instead of reusing
# the POSTGRES_USER superuser, and pre-creates the publication it reads from.
set -euo pipefail

: "${CDC_USER:?CDC_USER must be set}"
: "${CDC_PASSWORD:?CDC_PASSWORD must be set}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v cdc_user="$CDC_USER" -v cdc_password="$CDC_PASSWORD" <<-'EOSQL'
    CREATE ROLE :"cdc_user" WITH LOGIN REPLICATION PASSWORD :'cdc_password';
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"cdc_user";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"cdc_user";
    CREATE PUBLICATION zine_publication FOR ALL TABLES;
EOSQL
