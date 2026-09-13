import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { Question } from './question.entity.js';
import { CreateQuestionDto } from './create.question.dto.js';
import { TagsService } from '../tags/tags.service.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';
import type { QuestionRepository } from './question.repository.js';
import { CursorCodecService } from '../common/pagination/cursor-codec.service.js';
import { paginateByCursor } from '../common/pagination/keyset-paginate.js';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE, PaginationQueryDto } from '../common/pagination/pagination.dto.js';

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
        private readonly questionsRepository: QuestionRepository,
        private readonly tagsService: TagsService,
        private readonly cursorCodec: CursorCodecService,
    ) {}

    async create(dto: CreateQuestionDto, authorId: string): Promise<Question> {
        const { tags: tagNames, ...rest } = dto;
        const question = await this.questionsRepository.save({ ...rest, authorId });

        const uniqueTagNames = [...new Set(tagNames)];
        if (uniqueTagNames.length > 0) {
            const tags = await Promise.all(uniqueTagNames.map((name) => this.tagsService.findOrCreate(name)));
            await this.questionsRepository.addTags(question.id, tags.map((tag) => tag.id));
        }

        return this.findOneOrFail(question.id, ['author', 'tags']);
    }

    findAllPaginated(query: PaginationQueryDto): Promise<PaginatedResult<Question>> {
        const idQueryBuilder = this.questionsRepository.createQueryBuilder('question');

        return paginateByCursor(this.cursorCodec, {
            limit: query.limit ?? DEFAULT_PAGE_SIZE,
            cursor: query.cursor,
            direction: 'DESC',
            alias: 'question',
            idQueryBuilder,
            hydrate: (ids) =>
                this.questionsRepository.find({
                    where: { id: In(ids) },
                    relations: ['author', 'tags'],
                }),
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

    async attachTag(questionId: string, tagName: string): Promise<void> {
        await this.findOneOrFail(questionId);
        const tag = await this.tagsService.findOrCreate(tagName);
        try {
            await this.questionsRepository.addTags(questionId, [tag.id]);
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
        await this.questionsRepository.removeTag(questionId, tag.id);
    }
}
