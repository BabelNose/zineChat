# zineChat

A Q&A platform where users can ask questions, post answers, comment, and tag topics — with full-text search powered by a Postgres-backed search index that stays in sync in real time.

## Tech stack

**Backend (`api/`)**
- [NestJS](https://nestjs.com/) (TypeScript) REST API
- [PostgreSQL](https://www.postgresql.org/) via [TypeORM](https://typeorm.io/)
- Authentication with [Passport](https://www.passportjs.org/) (local + JWT strategies), sessions, and [Argon2](https://github.com/ranisalt/node-argon2) password hashing
- [Vitest](https://vitest.dev/) for unit and integration tests
- Docker Compose for local Postgres + API setup

**Frontend (`frontend/`)**
- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, TypeScript)
- [Vite](https://vite.dev/) build tooling

**Search (`search/`)**
- [Meilisearch](https://www.meilisearch.com/) for fast full-text search
- [Ventstream](https://github.com/ventstream/ventstream) for Postgres change-data-capture, streaming row-level changes straight into Meilisearch via logical replication
- Docker Compose for local Meilisearch + Ventstream setup

## Project structure

```
api/        NestJS backend API
frontend/   SvelteKit frontend
search/     Meilisearch + Ventstream sync stack
```

See each directory's README for setup and development instructions.

## Running everything with Docker Compose

The root [`docker-compose.yml`](docker-compose.yml) starts the whole stack — Postgres + API, Meilisearch + Ventstream, and the frontend — with a single command. It reuses `api/docker-compose.yml` and `search/docker-compose.yml` as-is, so each stack still reads its own `.env`.

**Prerequisites:** Docker with Compose v2.24 or newer (`docker compose version`).

### 1. Configure environment files

```bash
cp api/.env.example api/.env
cp search/.env.example search/.env
```

Fill in real values. In `search/.env`, `POSTGRES_DB`, `CDC_USER`, `CDC_PASSWORD` and `MEILI_MASTER_KEY` must match `api/.env`. The frontend needs no `.env` here: its `API_URL` is set in the compose file to reach the API container.

### 2. Start the stack

```bash
docker compose up -d --build
```

| Service     | URL                     |
|-------------|-------------------------|
| Frontend    | http://localhost:5173   |
| API         | http://localhost:4000   |
| Meilisearch | http://localhost:7700   |
| Postgres    | `localhost:5432`        |

### 3. Backfill search (first run only)

Once the API has started and created its tables, put them in scope for search and push the existing rows into Meilisearch:

```bash
bash search/scripts/backfill.sh -y
```

This is required on a brand-new environment; see [`search/README.md`](search/README.md) for details.

### Day-to-day commands

```bash
docker compose watch               # start with live sync of api/src and frontend/src
docker compose logs -f zine-api    # follow one service's logs
docker compose down                # stop everything (data is kept)
docker compose down -v             # stop and delete the Postgres volume
(cd api && npm run seed)           # optional: load sample data into the running database
```

The containers have fixed names (`zine-postgres`, `zine-api`, …), so stop any stack started from `api/` or `search/` before running the root one. The Postgres volume is shared between the two ways of starting it, so your data carries over.
