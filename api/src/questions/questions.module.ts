import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { QuestionsController } from './questions.controller.js';

@Module({
  providers: [QuestionsService],
  controllers: [QuestionsController]
})
export class QuestionsModule {}
