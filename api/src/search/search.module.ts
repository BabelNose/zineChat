import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { ISearchProvider } from './search.provider.interface.js';
import { MeilisearchSearchProvider } from './search.provider.meilisearch.js';
import { MEILISEARCH_CLIENT, createMeilisearchClient } from './meilisearch.provider.js';

@Module({
    imports: [ConfigModule],
    controllers: [SearchController],
    providers: [
        SearchService,
        {
            provide: ISearchProvider,
            useClass: MeilisearchSearchProvider,
        },
        {
            provide: MEILISEARCH_CLIENT,
            useFactory: createMeilisearchClient,
            inject: [ConfigService],
        },
    ],
})
export class SearchModule {}
