import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../common/current-user.decorator.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './create.comment.dto.js';
import { UpdateCommentDto } from './update.comment.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination.dto.js';

@Controller()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('questions/:questionId/comments')
    create(
        @Param('questionId') questionId: string,
        @CurrentUserId() authorId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentsService.create(questionId, dto, authorId);
    }

    @Get('questions/:questionId/comments')
    findByQuestion(@Param('questionId') questionId: string, @Query() query: PaginationQueryDto) {
        return this.commentsService.findByQuestionPaginated(questionId, query);
    }

    @Get('comments/:id')
    findOne(@Param('id') id: string) {
        return this.commentsService.findOneOrFail(id, ['author', 'question']);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('comments/:id')
    update(@Param('id') id: string, @CurrentUserId() authorId: string, @Body() dto: UpdateCommentDto) {
        return this.commentsService.update(id, authorId, dto);
    }

}
