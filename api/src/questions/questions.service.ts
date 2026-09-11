import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './question.entity.js';
import { CreateQuestionDto } from './create.question.dto.js';
import { UpdateQuestionDto } from './update.question.dto.js';
import { TagsService } from '../tags/tags.service.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';

const DETAILED_RELATIONS = [
    'author',
    'tags',
    'answers',
    'answers.author',
    'answers.medalAwarders',
    'comments',
    'comments.author',
];

@Injectable()
export class QuestionsService {
    constructor(
        @InjectRepository(Question)
        private readonly questionsRepository: Repository<Question>,
        private readonly tagsService: TagsService,
    ) {}

    async create(dto: CreateQuestionDto, authorId: string): Promise<Question> {
        const { tags: tagNames, ...rest } = dto;
        const question = await this.questionsRepository.save({ ...rest, authorId });

        const uniqueTagNames = [...new Set(tagNames)];
        if (uniqueTagNames.length > 0) {
            const tags = await Promise.all(uniqueTagNames.map((name) => this.tagsService.findOrCreate(name)));
            await this.questionsRepository
                .createQueryBuilder()
                .relation(Question, 'tags')
                .of(question.id)
                .add(tags.map((tag) => tag.id));
        }

        return this.findOneOrFail(question.id, ['author', 'tags']);
    }

    findAll(): Promise<Question[]> {
        return this.questionsRepository.find({
            relations: ['author', 'tags'],
            order: { created: 'DESC' },
        });
    }

    async findOneOrFail(id: string, relations: string[] = []): Promise<Question> {
        const question = await this.questionsRepository.findOne({ where: { id }, relations });
        if (!question) {
            throw new NotFoundException('Question not found');
        }
        return question;
    }

    findOneDetailed(id: string): Promise<Question> {
        return this.findOneOrFail(id, DETAILED_RELATIONS);
    }

    async update(id: string, authorId: string, dto: UpdateQuestionDto): Promise<Question> {
        const question = await this.findOneOrFail(id);
        if (question.authorId !== authorId) {
            throw new ForbiddenException('You can only edit your own question');
        }
        await this.questionsRepository.save({ ...dto, id });
        return this.findOneDetailed(id);
    }

    async attachTag(questionId: string, tagName: string): Promise<void> {
        await this.findOneOrFail(questionId);
        const tag = await this.tagsService.findOrCreate(tagName);
        try {
            await this.questionsRepository
                .createQueryBuilder()
                .relation(Question, 'tags')
                .of(questionId)
                .add(tag.id);
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                throw new ConflictException('Tag already attached to this question');
            }
            throw error;
        }
    }

    async detachTag(questionId: string, tagName: string): Promise<void> {
        await this.findOneOrFail(questionId);
        const tag = await this.tagsService.findByNameOrFail(tagName);
        await this.questionsRepository
            .createQueryBuilder()
            .relation(Question, 'tags')
            .of(questionId)
            .remove(tag.id);
    }
}
