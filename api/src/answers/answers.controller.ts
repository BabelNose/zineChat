import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUserId } from '../common/current-user.decorator.js';
import { AnswersService } from './answers.service.js';
import { CreateAnswerDto } from './create.answer.dto.js';
import { UpdateAnswerDto } from './update.answer.dto.js';

@Controller()
export class AnswersController {
    constructor(private readonly answersService: AnswersService) {}

    @UseGuards(JwtAuthGuard)
    @Post('questions/:questionId/answers')
    create(
        @Param('questionId') questionId: string,
        @CurrentUserId() authorId: string,
        @Body() dto: CreateAnswerDto,
    ) {
        return this.answersService.create(questionId, dto, authorId);
    }

    @Get('questions/:questionId/answers')
    findByQuestion(@Param('questionId') questionId: string) {
        return this.answersService.findByQuestion(questionId);
    }

    @Get('answers/:id')
    findOne(@Param('id') id: string) {
        return this.answersService.findOneOrFail(id, ['author', 'question', 'medalAwarders']);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('answers/:id')
    update(@Param('id') id: string, @CurrentUserId() authorId: string, @Body() dto: UpdateAnswerDto) {
        return this.answersService.update(id, authorId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('answers/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @CurrentUserId() authorId: string) {
        return this.answersService.remove(id, authorId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('answers/:id/medals')
    @HttpCode(HttpStatus.CREATED)
    awardMedal(@Param('id') id: string, @CurrentUserId() userId: string) {
        return this.answersService.awardMedal(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('answers/:id/medals')
    @HttpCode(HttpStatus.NO_CONTENT)
    revokeMedal(@Param('id') id: string, @CurrentUserId() userId: string) {
        return this.answersService.revokeMedal(id, userId);
    }
}
