import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity.js';
import { CreateTagDto } from './create.tag.dto.js';
import { UpdateTagDto } from './update.tag.dto.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE } from '../common/pagination/pagination.dto.js';
import { decodeOffsetCursor } from '../search/offset-cursor.js';
import { ISearchProvider } from '../search/search.provider.interface.js';
import { SearchQueryDto } from '../search/search-query.dto.js';

// Kept in sync by Ventstream (search/README.md). Searched directly here, rather
// than through the generic /search endpoint, since a tag hit has no single
// owning resource the way a question/answer/comment hit does - see
// search.service.ts for why that endpoint excludes this index.
const TAG_INDEX = 'zine_tag';

interface TagDocument {
    id: string;
    tag: string;
}

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private readonly tagsRepository: Repository<Tag>,
        @Inject(ISearchProvider)
        private readonly searchProvider: ISearchProvider,
    ) {}

    async create(dto: CreateTagDto): Promise<Tag> {
        try {
            return await this.tagsRepository.save(dto);
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                throw new ConflictException('Tag already exists');
            }
            throw error;
        }
    }

    findAll(): Promise<Tag[]> {
        return this.tagsRepository.find({ order: { tag: 'ASC' } });
    }

    async findOneOrFail(id: string): Promise<Tag> {
        const tag = await this.tagsRepository.findOneBy({ id });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        return tag;
    }

    async findByNameOrFail(name: string): Promise<Tag> {
        const tag = await this.tagsRepository.findOneBy({ tag: name });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }
        return tag;
    }

    async findOrCreate(name: string): Promise<Tag> {
        const existing = await this.tagsRepository.findOneBy({ tag: name });
        if (existing) {
            return existing;
        }
        try {
            return await this.tagsRepository.save({ tag: name });
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                return this.findByNameOrFail(name);
            }
            throw error;
        }
    }

    async update(id: string, dto: UpdateTagDto): Promise<Tag> {
        await this.findOneOrFail(id);
        try {
            await this.tagsRepository.save({ ...dto, id });
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                throw new ConflictException('Tag already exists');
            }
            throw error;
        }
        return this.findOneOrFail(id);
    }

    async remove(id: string): Promise<void> {
        await this.findOneOrFail(id);
        await this.tagsRepository.delete(id);
    }

    async search(query: SearchQueryDto): Promise<PaginatedResult<Tag>> {
        const limit = query.limit ?? DEFAULT_PAGE_SIZE;
        const offset = decodeOffsetCursor(query.cursor);

        const hits = await this.searchProvider.search([TAG_INDEX], query.q, { offset, limit: limit + 1 });

        const hasMore = hits.length > limit;
        const page = hasMore ? hits.slice(0, limit) : hits;
        const items = page.map((hit) => hit.document as unknown as TagDocument);
        const nextCursor = hasMore ? String(offset + limit) : null;

        return { items, nextCursor };
    }
}
