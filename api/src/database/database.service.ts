import { Injectable } from '@nestjs/common';
import { DataSource } from "typeorm";
import { InjectDataSource } from '@nestjs/typeorm';
import { Pool, PostgresDriver } from "pg";

@Injectable()
export class DatabaseService {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {}

    async getPool(): Promise<Pool> {
        const driver = this.dataSource.driver as PostgresDriver;
        return driver.master as Pool;
    }
}
