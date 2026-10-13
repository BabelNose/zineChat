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
