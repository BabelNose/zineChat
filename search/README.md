# Search

Full-text search for zineChat: [Meilisearch](https://www.meilisearch.com/),
kept in sync with Postgres via [Ventstream](https://github.com/ventstream/ventstream)
(CDC - no broker or webhook in between).

```
zine-postgres  --logical replication-->  zine-ventstream  --writes-->  zine-search
 (api/docker-compose.yml)                 (search/docker-compose.yml)
```

`zine-postgres` runs with `wal_level=logical` and publishes every table via
`zine_publication`. `zine-ventstream` streams row-level changes off that
publication into Meilisearch, one index per table (`zine_<table>`), using a
dedicated **`zine_cdc`** role (`REPLICATION` + `SELECT` only, created by
`api/initdb/01-create-cdc-user.sh`) - not the Postgres admin superuser.

## Starting it

`api` and `search` are separate compose projects sharing the `zine-shared`
network, so start `api` first:

```bash
cd api && docker compose up -d      # creates the zine-shared network
cd ../search && cp .env.example .env   # fill in real values, matching api/.env
docker compose up -d
```

`search/.env` needs `MEILI_MASTER_KEY`, and `POSTGRES_DB`/`CDC_USER`/`CDC_PASSWORD`
matching `api/.env`. Meilisearch is then at `http://localhost:7700`.

## The backfill particularity

`zine_cdc` can stream changes fine, but Postgres only exposes primary keys via
`information_schema` to a table's **owner** - not a `SELECT`-only role. So
`zine_cdc` can't run Ventstream's initial snapshot itself; it would skip every
table. The workaround: Ventstream only attempts that snapshot while creating
its replication slot, and skips it entirely on every later start (any role) -
so the slot just needs to be created **once**, by an admin-privileged run.

- **Brand-new database:** invisible - nothing to backfill, so the service's own
  first boot (as `zine_cdc`) creates the slot and starts clean.
- **Database with existing data** (restoring a dump, or forcing a resync after
  wiping Meilisearch): run `bash scripts/backfill.sh` (`-y` to skip the prompt).
  It runs a throwaway, admin-authenticated Ventstream container on its own
  disposable slot to push a full snapshot into Meilisearch, then cleans itself
  up - the live `zine-ventstream` service and its slot are never touched.
  Requires `api`'s stack running and both `.env` files filled in.

## Data directories

`meilisearch_data/` and `ventstream_data/` are bind-mounted, gitignored
(`.gitkeep` only) so both services persist data across restarts.
