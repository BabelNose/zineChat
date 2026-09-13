import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../common/current-user.decorator.js';
import { QuestionsService } from './questions.service.js';
import { CreateQuestionDto } from './create.question.dto.js';
import { PaginationQueryDto } from '../common/pagination/pagination.dto.js';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@CurrentUserId() authorId: string, @Body() dto: CreateQuestionDto) {
        return this.questionsService.create(dto, authorId);
    }

    @Get()
    findAll(@Query() query: PaginationQueryDto) {
        return this.questionsService.findAllPaginated(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.questionsService.findOneDetailed(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/tags/:tagName')
    @HttpCode(HttpStatus.NO_CONTENT)
    attachTag(@Param('id') id: string, @Param('tagName') tagName: string) {
        return this.questionsService.attachTag(id, tagName);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/tags/:tagName')
    @HttpCode(HttpStatus.NO_CONTENT)
    detachTag(@Param('id') id: string, @Param('tagName') tagName: string) {
        return this.questionsService.detachTag(id, tagName);
    }
}
