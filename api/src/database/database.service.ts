import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from "typeorm";
import { InjectDataSource } from '@nestjs/typeorm';
import { Pool } from "pg";
import { PostgresDriver } from "typeorm/driver/postgres/PostgresDriver.js";

@Injectable()
export class DatabaseService {
    private readonly logger = new Logger(DatabaseService.name);

    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {}

    async getPGPool(): Promise<Pool> {
        const driver = this.dataSource.driver as PostgresDriver;
        return driver.master as Pool;
    }

    checkEntities() {
        if (this.dataSource.isInitialized) {
            const loadedEntities = this.dataSource.entityMetadatas.map(metadata => metadata.name);
        
            this.logger.log('Successfully loaded entities:', loadedEntities);
        }else{
            this.logger.log('Data source not ready could not check entities');
        }
    }
}
