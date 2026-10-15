import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Tag } from './tag.entity.js';
import { TagsService } from './tags.service.js';
import { TagsController } from './tags.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Tag]), PassportModule.register({})],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
