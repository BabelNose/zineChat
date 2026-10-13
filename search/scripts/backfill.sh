#!/bin/bash
# Re-sync existing Postgres rows into Meilisearch via a one-off Ventstream run.
#
# Normally this isn't needed: a brand new environment's zine-ventstream service
# backfills on its own first boot. Use this script when you need to REDO that
# backfill later - e.g. Meilisearch data was wiped, or you want to force a full
# resync - without touching the live zine-ventstream service or its replication
# slot (zine_ventstream_slot) at all.
#
# This also (re)applies the publication's table allowlist every run - see
# ALLOWED_TABLES below. api/initdb/01-create-cdc-user.sql creates the
# publication empty on purpose (it runs before the app's migrations, so the
# real tables don't exist yet), so this is what actually puts tables in scope.
# That means this script needs to run at least once on any environment,
# including a brand-new one, before zine-ventstream has anything to stream.
#
# How the actual backfill works: Ventstream's snapshot-based primary-key
# discovery only works for a table's owner (or a role granted membership in
# it), not a plain SELECT-granted role - see api/initdb/01-create-cdc-user.sql
# and the PR description for details. So this script runs a throwaway
# Ventstream container, authenticated as the Postgres admin superuser, on its
# OWN dedicated replication slot (created fresh and dropped again at the end
# of this script) purely to push a consistent snapshot of current rows into
# Meilisearch.
#
# Usage: bash backfill.sh [-y|--yes]   (-y skips the confirmation prompt)
# (chmod +x it first if you'd rather run ./backfill.sh directly)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEARCH_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$(cd "$SEARCH_DIR/../api" && pwd)"

# shellcheck disable=SC1091
set -a
source "$API_DIR/.env"
source "$SEARCH_DIR/.env"
set +a

: "${POSTGRES_USER:?POSTGRES_USER must be set in api/.env}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in api/.env}"
: "${POSTGRES_DB:?POSTGRES_DB must be set in api/.env}"
: "${MEILI_MASTER_KEY:?MEILI_MASTER_KEY must be set in search/.env}"

# Keep this in sync with the image tag in search/docker-compose.yml.
VENTSTREAM_IMAGE="ghcr.io/ventstream/ventstream:0.1.43"
PUBLICATION="zine_publication"
INDEX_PREFIX="zine_"
CONTAINER_NAME="zine-ventstream-backfill"
SLOT_NAME="zine_ventstream_backfill"

# The only tables ever synced into Meilisearch. answer_medals, session, and
# "user" must never appear here - add a table deliberately, don't assume it.
ALLOWED_TABLES="public.answer, public.comment, public.question, public.question_tag, public.tag"

if [[ "${1:-}" != "-y" && "${1:-}" != "--yes" ]]; then
  echo "This sets '$PUBLICATION' to sync exactly: $ALLOWED_TABLES"
  echo "then re-reads those tables as the Postgres admin user and pushes a fresh"
  echo "snapshot into Meilisearch indexes prefixed '$INDEX_PREFIX'."
  echo "The live zine-ventstream service is left untouched."
  read -r -p "Continue? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

if ! docker ps --format '{{.Names}}' | grep -qx zine-postgres; then
  echo "zine-postgres isn't running - start api/docker-compose.yml first." >&2
  exit 1
fi

if ! docker network inspect zine-shared >/dev/null 2>&1; then
  echo "Docker network 'zine-shared' not found - start api/docker-compose.yml first." >&2
  exit 1
fi

echo "Setting '$PUBLICATION' table scope..."
docker exec zine-postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "ALTER PUBLICATION $PUBLICATION SET TABLE $ALLOWED_TABLES;" >/dev/null

# Clean up a slot left behind by a previous run that didn't finish.
if docker exec zine-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT 1 FROM pg_replication_slots WHERE slot_name='$SLOT_NAME'" | grep -q 1; then
  echo "Dropping leftover slot from a previous run..."
  docker exec zine-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
    "SELECT pg_drop_replication_slot('$SLOT_NAME');" >/dev/null
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

echo "Starting backfill run..."
docker run -d --name "$CONTAINER_NAME" --network zine-shared \
  -e VS_ROLES=cdc \
  -e VS_CDC_SOURCE=postgres \
  -e VS_PG_HOST=db \
  -e VS_PG_PORT=5432 \
  -e VS_PG_USER="$POSTGRES_USER" \
  -e VS_PG_PASSWORD="$POSTGRES_PASSWORD" \
  -e VS_PG_DATABASE="$POSTGRES_DB" \
  -e VS_PG_PUBLICATION="$PUBLICATION" \
  -e VS_PG_SLOT="$SLOT_NAME" \
  -e VS_PG_BOOTSTRAP_MODE=snapshot \
  -e VS_SINK=meilisearch \
  -e VS_MEILI_ENDPOINT=http://host.docker.internal:7700 \
  -e VS_MEILI_API_KEY="$MEILI_MASTER_KEY" \
  -e VS_MEILI_INDEX_PREFIX="$INDEX_PREFIX" \
  "$VENTSTREAM_IMAGE" >/dev/null

echo "Waiting for the snapshot to complete..."
for _ in $(seq 1 30); do
  if docker logs "$CONTAINER_NAME" 2>&1 | grep -q "snapshot bootstrap complete"; then
    break
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "Container exited unexpectedly - check: docker logs $CONTAINER_NAME" >&2
    exit 1
  fi
  sleep 1
done

echo
echo "--- tables backfilled ---"
docker logs "$CONTAINER_NAME" 2>&1 | grep "snapshot table complete" || echo "(none found in logs)"
echo

docker rm -f "$CONTAINER_NAME" >/dev/null
docker exec zine-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "SELECT pg_drop_replication_slot('$SLOT_NAME');" >/dev/null

echo "Backfill complete. The live zine-ventstream service was not touched."
