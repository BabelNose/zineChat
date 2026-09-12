import { Module } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Question } from './question.entity.js';
import { QuestionsService } from './questions.service.js';
import { QuestionsController } from './questions.controller.js';
import { TagsModule } from '../tags/tags.module.js';
import { createQuestionRepository } from './question.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Question]), TagsModule, PassportModule.register({})],
  providers: [
    QuestionsService,
    {
      provide: getRepositoryToken(Question),
      useFactory: createQuestionRepository,
      inject: [getDataSourceToken()],
    },
  ],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
