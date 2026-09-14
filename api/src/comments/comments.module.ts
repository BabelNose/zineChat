import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Comment } from './comment.entity.js';
import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';
import { QuestionsModule } from '../questions/questions.module.js';
import { PaginationModule } from '../common/pagination/pagination.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), QuestionsModule, PassportModule.register({}), PaginationModule],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
