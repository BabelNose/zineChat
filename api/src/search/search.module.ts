import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../questions/question.entity.js';
import { SecretModule } from '../secret/secret.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { SearchCursorCodecService } from './search-cursor-codec.service.js';
import { MEILISEARCH_CLIENT, createMeilisearchClient } from './meilisearch.provider.js';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Question]), SecretModule],
    controllers: [SearchController],
    providers: [
        SearchService,
        SearchCursorCodecService,
        {
            provide: MEILISEARCH_CLIENT,
            useFactory: createMeilisearchClient,
            inject: [ConfigService],
        },
    ],
})
export class SearchModule {}
