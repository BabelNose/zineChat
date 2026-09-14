import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Comment } from './comment.entity.js';
import { CreateCommentDto } from './create.comment.dto.js';
import { UpdateCommentDto } from './update.comment.dto.js';
import { QuestionsService } from '../questions/questions.service.js';
import { CursorCodecService } from '../common/pagination/cursor-codec.service.js';
import { paginateByCursor } from '../common/pagination/keyset-paginate.js';
import { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import { DEFAULT_PAGE_SIZE, PaginationQueryDto } from '../common/pagination/pagination.dto.js';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentsRepository: Repository<Comment>,
        private readonly questionsService: QuestionsService,
        private readonly cursorCodec: CursorCodecService,
    ) {}

    async create(questionId: string, dto: CreateCommentDto, authorId: string): Promise<Comment> {
        await this.questionsService.findOneOrFail(questionId);
        const comment = await this.commentsRepository.save({ ...dto, questionId, authorId });
        return this.findOneOrFail(comment.id, ['author']);
    }

    async findByQuestionPaginated(
        questionId: string,
        query: PaginationQueryDto,
    ): Promise<PaginatedResult<Comment>> {
        await this.questionsService.findOneOrFail(questionId);

        const idQueryBuilder = this.commentsRepository
            .createQueryBuilder('comment')
            .where('comment.questionId = :questionId', { questionId });

        return paginateByCursor(this.cursorCodec, {
            limit: query.limit ?? DEFAULT_PAGE_SIZE,
            cursor: query.cursor,
            direction: 'ASC',
            alias: 'comment',
            idQueryBuilder,
            hydrate: (ids) =>
                this.commentsRepository.find({
                    where: { id: In(ids) },
                    relations: ['author'],
                }),
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
