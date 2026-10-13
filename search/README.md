# Search

Full-text search for zineChat: [Meilisearch](https://www.meilisearch.com/),
kept in sync with Postgres via [Ventstream](https://github.com/ventstream/ventstream)
(CDC - no broker or webhook in between).

```
zine-postgres  --logical replication-->  zine-ventstream  --writes-->  zine-search
 (api/docker-compose.yml)                 (search/docker-compose.yml)
```

`zine-postgres` runs with `wal_level=logical` and publishes an **allowlist** of
tables via `zine_publication` - currently `answer`, `comment`, `question`,
`question_tag`, `tag`. **`answer_medals`, `session`, and `user` must never be
in it** - don't add them. Adding a new table to search is a deliberate edit to
`ALLOWED_TABLES` in `scripts/backfill.sh`, not automatic.

`zine-ventstream` streams row-level changes off that publication into
Meilisearch, one index per table (`zine_<table>`), using a dedicated
**`zine_cdc`** role (`REPLICATION` + `SELECT` only, created by
`api/initdb/01-create-cdc-user.sql`) - not the Postgres admin superuser.

## Starting it

`api` and `search` are separate compose projects sharing the `zine-shared`
network, so start `api` first:

```bash
cd api && docker compose up -d      # creates the zine-shared network
cd ../search && cp .env.example .env   # fill in real values, matching api/.env
docker compose up -d
bash scripts/backfill.sh            # required even on a brand-new environment - see below
```

`search/.env` needs `MEILI_MASTER_KEY`, and `POSTGRES_DB`/`CDC_USER`/`CDC_PASSWORD`
matching `api/.env`. Meilisearch is then at `http://localhost:7700`.

## The backfill particularity

`zine_publication` is created **empty** by `01-create-cdc-user.sql`, because
that script runs before the app's own migrations - the real tables don't
exist yet. So `scripts/backfill.sh` is what actually puts tables in scope
(`ALTER PUBLICATION ... SET TABLE`, from its `ALLOWED_TABLES` list) - meaning
it must run at least once on **any** environment, including a fresh one,
before `zine-ventstream` has anything to stream.

It also pushes a full snapshot of those tables into Meilisearch, which is
needed any time there's existing data to catch up on: a fresh environment
with existing data (restoring a dump), or forcing a resync later (e.g. after
wiping Meilisearch). Run `bash scripts/backfill.sh` (`-y` to skip the
confirmation prompt) - it uses a throwaway, admin-authenticated Ventstream
container on its own disposable replication slot, then cleans itself up. The
live `zine-ventstream` service and its slot are never touched.

Why admin-authenticated: Postgres only exposes primary keys via
`information_schema` to a table's **owner**, not a `SELECT`-only role like
`zine_cdc` - so `zine_cdc` can't run this snapshot itself, it would just skip
every table. Ventstream only attempts that snapshot while creating a
replication slot, and skips it entirely on every later start (any role) - so
once `backfill.sh` has created `zine-ventstream`'s slot once, the standing
service streams new changes fine as `zine_cdc` from then on.

Requires `api`'s stack running and both `.env` files filled in.

## Data directories

`meilisearch_data/` and `ventstream_data/` are bind-mounted, gitignored
(`.gitkeep` only) so both services persist data across restarts.
