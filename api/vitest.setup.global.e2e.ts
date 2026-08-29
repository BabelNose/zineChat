import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node'
let postgresContainer: StartedPostgreSqlContainer;

declare module 'vitest' {
  export interface ProvidedContext {
    POSTGRES_HOST: string
    POSTGRES_PORT: string
    POSTGRES_USER: string
    POSTGRES_PASSWORD: string
    POSTGRES_DB: string
  }
}

export async function setup(project: TestProject) {
  await setupPostGresContainer(project);
}

export async function teardown() {
  // Explicitly stop the container after ALL test files finish
  if (postgresContainer) {
    await postgresContainer.stop();
  }
}

async function setupPostGresContainer(project: TestProject){
  postgresContainer = await new PostgreSqlContainer('postgres:latest')
  .start();

  project.provide('POSTGRES_HOST', postgresContainer.getHost());
  project.provide('POSTGRES_PORT', postgresContainer.getMappedPort(5432).toString());
  project.provide('POSTGRES_USER', postgresContainer.getUsername());
  project.provide('POSTGRES_PASSWORD', postgresContainer.getPassword());
  project.provide('POSTGRES_DB', postgresContainer.getDatabase());
}