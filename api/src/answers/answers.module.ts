import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Answer } from './answer.entity.js';
import { AnswersService } from './answers.service.js';
import { AnswersController } from './answers.controller.js';
import { QuestionsModule } from '../questions/questions.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Answer]), QuestionsModule, PassportModule.register({})],
  providers: [AnswersService],
  controllers: [AnswersController],
  exports: [AnswersService],
})
export class AnswersModule {}
