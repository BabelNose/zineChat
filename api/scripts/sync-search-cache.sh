#!/bin/bash
# Creates (or refreshes) the Postgres triggers that maintain
# question.answerCount, question.commentCount, and question.tagsCache - see
# sync-search-cache.sql for what they do and why.
#
# Required once on every environment after this change is deployed - not
# part of api/initdb (fresh-volume only) and not something TypeORM's
# `synchronize` can create. Safe to re-run anytime: every statement is
# idempotent, and the trailing backfill just recomputes the cache for all
# current rows (which Ventstream then streams into Meilisearch on its own -
# see sync-search-cache.sql's last comment).
#
# Usage: bash sync-search-cache.sh
# (chmod +x it first if you'd rather run ./sync-search-cache.sh directly)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"

# shellcheck disable=SC1091
set -a
source "$API_DIR/.env"
set +a

: "${POSTGRES_USER:?POSTGRES_USER must be set in api/.env}"
: "${POSTGRES_DB:?POSTGRES_DB must be set in api/.env}"

if ! docker ps --format '{{.Names}}' | grep -qx zine-postgres; then
  echo "zine-postgres isn't running - start api/docker-compose.yml first." >&2
  exit 1
fi

echo "Applying search cache columns, triggers, and backfill..."
docker exec -i zine-postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < "$SCRIPT_DIR/sync-search-cache.sql"

echo "Done. question.answerCount / commentCount / tagsCache are now trigger-maintained."
