# Search

Full-text search for zineChat, backed by [Meilisearch](https://www.meilisearch.com/)
and kept in sync with Postgres via [Ventstream](https://github.com/ventstream/ventstream),
a change-data-capture (CDC) engine.

## How it fits together

```
zine-postgres  --logical replication-->  zine-ventstream  --writes-->  zine-search
 (api/docker-compose.yml)                 (search/docker-compose.yml, over the
                                            zine-shared docker network)
```

- **zine-postgres** (from `api/docker-compose.yml`) runs with `wal_level=logical`
  and publishes every table via a Postgres **publication** (`zine_publication`).
- **zine-ventstream** streams row-level changes (insert/update/delete) off that
  publication and writes them straight into Meilisearch - one index per table,
  named `zine_<table>`. There's no broker and no webhook in between.
- **zine-search** is just the official Meilisearch image.

Ventstream connects to Postgres as a dedicated **`zine_cdc`** role, created
automatically by `api/initdb/01-create-cdc-user.sh` the first time Postgres
initializes. That role only has `REPLICATION` + `SELECT` - never the admin
superuser credentials - so a leaked Ventstream credential can read and stream
data but can't write to the database or do anything administrative.

## Starting it

The two compose files are **separate projects** that share a network
(`zine-shared`), so start `api` first:

```bash
cd api && docker compose up -d      # creates the zine-shared network
cd ../search
cp .env.example .env                # fill in real values - see below
docker compose up -d
```

`search/.env` needs:

| Var | Notes |
|---|---|
| `MEILI_MASTER_KEY` | Meilisearch's auth key |
| `POSTGRES_DB` | must match `api/.env` |
| `CDC_USER` / `CDC_PASSWORD` | must match the `CDC_USER`/`CDC_PASSWORD` in `api/.env` - that's what `01-create-cdc-user.sh` uses to create the role |

Once up, Meilisearch is at `http://localhost:7700` and `zine-ventstream` tails
new Postgres changes into it continuously.

## The backfill particularity

This is the one non-obvious part of the setup.

Ventstream's initial sync (its "snapshot bootstrap") discovers each table's
primary key via `information_schema`, which Postgres only exposes to a
table's **owner** (or a role granted membership in it) - not to a role that
merely has `SELECT`, even though `SELECT` is all Ventstream actually needs to
read the rows. Since `zine_cdc` is intentionally **not** an owner, its very
first bootstrap attempt can't see any primary keys and skips every table with
a warning, backfilling nothing.

The fix in place: Postgres only runs the bootstrap on the *first* connection
that creates the engine's replication slot - once that slot exists, every
future start (whatever role) skips the bootstrap and just tails new changes.
So the slot is created **once**, by an admin-privileged run, and the
permanent `zine-ventstream` service (using `zine_cdc`) never has to do that
step itself.

**On a brand-new database** (no existing rows) this is invisible - the
compose service's own first boot creates the slot and backfills nothing,
because there's nothing to backfill yet.

**Against a database that already has data** (restoring a dump, pointing this
at an existing environment, or wanting to force a full resync later - e.g.
after wiping Meilisearch), run:

```bash
bash scripts/backfill.sh          # prompts for confirmation
bash scripts/backfill.sh -y       # skip the prompt
```

It spins up a throwaway Ventstream container authenticated as the Postgres
admin user, on its **own** dedicated, disposable replication slot (not the
standing service's slot), pushes a consistent snapshot of every table into
Meilisearch, then drops that slot and exits. The live `zine-ventstream`
service is never stopped or restarted - this only backfills past rows,
nothing about ongoing streaming changes.

Requirements to run it: `api/docker-compose.yml` must be up (for `zine-postgres`
and the `zine-shared` network), and both `api/.env` and `search/.env` must be
filled in - it reads Postgres admin credentials from the former and the
Meilisearch key from the latter.

## Data directories

`meilisearch_data/` and `ventstream_data/` are bind-mounted volumes (gitignored
except for a `.gitkeep`) so both services keep their data across restarts.
