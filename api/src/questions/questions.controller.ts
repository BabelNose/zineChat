import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../common/current-user.decorator.js';
import { QuestionsService } from './questions.service.js';
import { CreateQuestionDto } from './create.question.dto.js';
import { UpdateQuestionDto } from './update.question.dto.js';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@CurrentUserId() authorId: string, @Body() dto: CreateQuestionDto) {
        return this.questionsService.create(dto, authorId);
    }

    @Get()
    findAll() {
        return this.questionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.questionsService.findOneDetailed(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @CurrentUserId() authorId: string, @Body() dto: UpdateQuestionDto) {
        return this.questionsService.update(id, authorId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/tags/:tagId')
    @HttpCode(HttpStatus.NO_CONTENT)
    attachTag(@Param('id') id: string, @Param('tagId') tagId: string) {
        return this.questionsService.attachTag(id, tagId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/tags/:tagId')
    @HttpCode(HttpStatus.NO_CONTENT)
    detachTag(@Param('id') id: string, @Param('tagId') tagId: string) {
        return this.questionsService.detachTag(id, tagId);
    }
}
