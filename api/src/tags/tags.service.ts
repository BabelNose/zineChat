import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity.js';
import { CreateTagDto } from './create.tag.dto.js';
import { UpdateTagDto } from './update.tag.dto.js';

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
            if (error.code === '23505') {
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

    async update(id: string, dto: UpdateTagDto): Promise<Tag> {
        await this.findOneOrFail(id);
        try {
            await this.tagsRepository.save({ ...dto, id });
        } catch (error: any) {
            if (error.code === '23505') {
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
}
