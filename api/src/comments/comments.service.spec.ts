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
  let questionsService: any;

  beforeEach(async () => {
    repository = { save: vi.fn(), findOne: vi.fn() };
    questionsService = { findOneOrFail: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: repository },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
  });

  it('creates a comment with its question and author context', async () => {
    const comment = { id: 'comment-1', comment: 'Useful!', questionId: 'question-1', authorId: 'user-1' } as Comment;
    questionsService.findOneOrFail.mockResolvedValue({ id: 'question-1' });
    repository.save.mockResolvedValue({ id: 'comment-1' });
    repository.findOne.mockResolvedValue(comment);

    await expect(service.create('question-1', { comment: 'Useful!' }, 'user-1')).resolves.toEqual(comment);
  });

  it('rejects comments on a missing question', async () => {
    questionsService.findOneOrFail.mockRejectedValue(new NotFoundException('Question not found'));

    await expect(service.create('missing', { comment: 'Useful!' }, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('translates a missing comment into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates a comment owned by the current user', async () => {
    const existing = { id: 'comment-1', authorId: 'user-1' } as Comment;
    const updated = { ...existing, comment: 'New' } as Comment;
    repository.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    repository.save.mockResolvedValue(undefined);

    await expect(service.update('comment-1', 'user-1', { comment: 'New' })).resolves.toEqual(updated);
  });

  it('rejects edits by another user', async () => {
    repository.findOne.mockResolvedValue({ id: 'comment-1', authorId: 'user-1' });

    await expect(service.update('comment-1', 'user-2', { comment: 'Changed' })).rejects.toThrow(ForbiddenException);
  });
});
