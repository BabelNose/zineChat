import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { Comment } from './comment.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let comments: Comment[];
  let questions: Set<string>;

  beforeEach(async () => {
    comments = [];
    questions = new Set(['question-1']);
    const questionsService = { findOneOrFail: async (id: string) => {
      if (!questions.has(id)) throw new NotFoundException('Question not found');
      return { id };
    } };
    const repository = {
      save: async (value: Partial<Comment>) => {
        const existing = comments.find((comment) => comment.id === value.id);
        if (existing) return Object.assign(existing, value);
        const comment = { id: `comment-${comments.length + 1}`, ...value } as Comment;
        comments.push(comment);
        return comment;
      },
      find: async ({ where }: any) => comments.filter((comment) => comment.questionId === where.questionId),
      findOne: async ({ where }: any) => comments.find((comment) => comment.id === where.id) ?? null,
      delete: async (id: string) => { comments = comments.filter((comment) => comment.id !== id); },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: repository },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
  });

  it('creates a comment for an existing question', async () => {
    const result = await service.create('question-1', { comment: 'Useful!' }, 'user-1');
    expect(result).toMatchObject({ id: 'comment-1', comment: 'Useful!', questionId: 'question-1', authorId: 'user-1' });
    await expect(service.findByQuestion('question-1')).resolves.toEqual([result]);
  });

  it('rejects comments on a missing question', async () => {
    await expect(service.create('missing', { comment: 'Useful!' }, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('returns a comment and rejects missing comments', async () => {
    const comment = await service.create('question-1', { comment: 'Hello' }, 'user-1');
    await expect(service.findOneOrFail(comment.id)).resolves.toEqual(comment);
    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('allows the author to update and remove a comment', async () => {
    const comment = await service.create('question-1', { comment: 'Old' }, 'user-1');
    await expect(service.update(comment.id, 'user-1', { comment: 'New' })).resolves.toMatchObject({ comment: 'New' });
    await service.remove(comment.id, 'user-1');
    await expect(service.findOneOrFail(comment.id)).rejects.toThrow(NotFoundException);
  });

  it('rejects edits and removal by another user without changing the comment', async () => {
    const comment = await service.create('question-1', { comment: 'Original' }, 'user-1');
    await expect(service.update(comment.id, 'user-2', { comment: 'Changed' })).rejects.toThrow(ForbiddenException);
    await expect(service.remove(comment.id, 'user-2')).rejects.toThrow(ForbiddenException);
    await expect(service.findOneOrFail(comment.id)).resolves.toEqual(comment);
  });
});
