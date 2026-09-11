import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './answer.entity.js';
import { CreateAnswerDto } from './create.answer.dto.js';
import { UpdateAnswerDto } from './update.answer.dto.js';
import { QuestionsService } from '../questions/questions.service.js';
import { User } from '../users/user.entity.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';

@Injectable()
export class AnswersService {
    constructor(
        @InjectRepository(Answer)
        private readonly answersRepository: Repository<Answer>,
        private readonly questionsService: QuestionsService,
    ) {}

    async create(questionId: string, dto: CreateAnswerDto, authorId: string): Promise<Answer> {
        await this.questionsService.findOneOrFail(questionId);
        const answer = await this.answersRepository.save({ ...dto, questionId, authorId });
        return this.findOneOrFail(answer.id, ['author']);
    }

    async findByQuestion(questionId: string): Promise<Answer[]> {
        await this.questionsService.findOneOrFail(questionId);
        return this.answersRepository.find({
            where: { questionId },
            relations: ['author', 'medalAwarders'],
            order: { created: 'ASC' },
        });
    }

    async findOneOrFail(id: string, relations: string[] = []): Promise<Answer> {
        const answer = await this.answersRepository.findOne({ where: { id }, relations });
        if (!answer) {
            throw new NotFoundException('Answer not found');
        }
        return answer;
    }

    async update(id: string, authorId: string, dto: UpdateAnswerDto): Promise<Answer> {
        const answer = await this.findOneOrFail(id);
        if (answer.authorId !== authorId) {
            throw new ForbiddenException('You can only edit your own answer');
        }
        await this.answersRepository.save({ ...dto, id });
        return this.findOneOrFail(id, ['author', 'question', 'medalAwarders']);
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
}
