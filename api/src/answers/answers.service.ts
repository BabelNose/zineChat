import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Answer } from './answer.entity.js';
import { CreateAnswerDto } from './create.answer.dto.js';
import { QuestionsService } from '../questions/questions.service.js';
import { User } from '../users/user.entity.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';
import { CursorCodecService } from '../common/pagination/cursor-codec.service.js';
import { paginateByCursor } from '../common/pagination/keyset-paginate.js';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE, PaginationQueryDto } from '../common/pagination/pagination.dto.js';

@Injectable()
export class AnswersService {
    constructor(
        @InjectRepository(Answer)
        private readonly answersRepository: Repository<Answer>,
        private readonly questionsService: QuestionsService,
        private readonly cursorCodec: CursorCodecService,
    ) {}

    async create(questionId: string, dto: CreateAnswerDto, authorId: string): Promise<Answer> {
        await this.questionsService.findOneOrFail(questionId);
        try {
            const answer = await this.answersRepository.save({ ...dto, questionId, authorId });
            return this.findOneOrFail(answer.id, ['author']);
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                throw new ConflictException('You have already answered this question');
            }
            throw error;
        }
    }

    async findByQuestionPaginated(
        questionId: string,
        query: PaginationQueryDto,
    ): Promise<PaginatedResult<Answer>> {
        await this.questionsService.findOneOrFail(questionId);

        const idQueryBuilder = this.answersRepository
            .createQueryBuilder('answer')
            .where('answer.questionId = :questionId', { questionId });

        return paginateByCursor(this.cursorCodec, {
            limit: query.limit ?? DEFAULT_PAGE_SIZE,
            cursor: query.cursor,
            direction: 'ASC',
            alias: 'answer',
            idQueryBuilder,
            hydrate: (ids) =>
                this.answersRepository.find({
                    where: { id: In(ids) },
                    relations: ['author', 'medalAwarders'],
                }),
        });
    }

    async findOneOrFail(id: string, relations: string[] = []): Promise<Answer> {
        const answer = await this.answersRepository.findOne({ where: { id }, relations });
        if (!answer) {
            throw new NotFoundException('Answer not found');
        }
        return answer;
    }

    async awardMedal(answerId: string, userId: string): Promise<void> {
        await this.findOneOrFail(answerId);
        try {
            await this.answersRepository
                .createQueryBuilder()
                .relation(Answer, 'medalAwarders')
                .of(answerId)
                .add(userId);
        } catch (error: any) {
            if (error.code === PG_UNIQUE_VIOLATION) {
                throw new ConflictException('You have already awarded a medal to this answer');
            }
            throw error;
        }
    }

    async revokeMedal(answerId: string, userId: string): Promise<void> {
        await this.findOneOrFail(answerId);
        const awarders: User[] = await this.answersRepository
            .createQueryBuilder()
            .relation(Answer, 'medalAwarders')
            .of(answerId)
            .loadMany();
        if (!awarders.some((user) => user.id === userId)) {
            throw new NotFoundException('Medal not found for this user on this answer');
        }
        await this.answersRepository
            .createQueryBuilder()
            .relation(Answer, 'medalAwarders')
            .of(answerId)
            .remove(userId);
    }

    async remove(id: string, authorId: string): Promise<void> {
        const answer = await this.findOneOrFail(id);
        if (answer.authorId !== authorId) {
            throw new ForbiddenException('You can only delete your own answer');
        }
        await this.answersRepository.delete(id);
    }
}
