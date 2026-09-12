import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity.js';
import { CreateTagDto } from './create.tag.dto.js';
import { UpdateTagDto } from './update.tag.dto.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private readonly tagsRepository: Repository<Tag>,
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
}
