import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity.js';
import { CreateCommentDto } from './create.comment.dto.js';
import { UpdateCommentDto } from './update.comment.dto.js';
import { QuestionsService } from '../questions/questions.service.js';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
        private readonly questionsService: QuestionsService,
    ) {}

    async create(questionId: string, dto: CreateCommentDto, authorId: string): Promise<Comment> {
        await this.questionsService.findOneOrFail(questionId);
        const comment = await this.commentsRepository.save({ ...dto, questionId, authorId });
        return this.findOneOrFail(comment.id, ['author']);
    }

    async findByQuestion(questionId: string): Promise<Comment[]> {
        await this.questionsService.findOneOrFail(questionId);
        return this.commentsRepository.find({
            where: { questionId },
            relations: ['author'],
            order: { created: 'ASC' },
        });
    }

    async findOneOrFail(id: string, relations: string[] = []): Promise<Comment> {
        const comment = await this.commentsRepository.findOne({ where: { id }, relations });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        return comment;
    }

    async update(id: string, authorId: string, dto: UpdateCommentDto): Promise<Comment> {
        const comment = await this.findOneOrFail(id);
        if (comment.authorId !== authorId) {
            throw new ForbiddenException('You can only edit your own comment');
        }
        await this.commentsRepository.save({ ...dto, id });
        return this.findOneOrFail(id, ['author', 'question']);
    }

    async remove(id: string, authorId: string): Promise<void> {
        const comment = await this.findOneOrFail(id);
        if (comment.authorId !== authorId) {
            throw new ForbiddenException('You can only delete your own comment');
        }
        await this.commentsRepository.delete(id);
    }
}
