import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { Comment } from './comment.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: any;

  beforeEach(async () => {
    repository = { findOne: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: repository },
        { provide: QuestionsService, useValue: {} },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
  });

  it('translates a missing comment into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects edits by another user', async () => {
    repository.findOne.mockResolvedValue({ id: 'comment-1', authorId: 'user-1' });

    await expect(service.update('comment-1', 'user-2', { comment: 'Changed' })).rejects.toThrow(ForbiddenException);
  });
});
