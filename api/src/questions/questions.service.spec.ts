import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { Question } from './question.entity.js';
import { TagsService } from '../tags/tags.service.js';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;
  let tagsService: any;

  beforeEach(async () => {
    repository = { save: vi.fn(), findOne: vi.fn(), createQueryBuilder: vi.fn() };
    tagsService = { findOneOrFail: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getRepositoryToken(Question), useValue: repository },
        { provide: TagsService, useValue: tagsService },
      ],
    }).compile();
    service = module.get<QuestionsService>(QuestionsService);
  });

  it('creates a question with its author context', async () => {
    const question = { id: 'question-1', question: 'How do I bind a zine?', authorId: 'user-1' } as Question;
    repository.save.mockResolvedValue({ id: 'question-1' });
    repository.findOne.mockResolvedValue(question);

    await expect(service.create({ question: 'How do I bind a zine?' }, 'user-1')).resolves.toEqual(question);
  });

  it('translates a missing question into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates a question owned by the current user', async () => {
    const existing = { id: 'question-1', authorId: 'user-1' } as Question;
    const updated = { ...existing, question: 'New' } as Question;
    repository.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    repository.save.mockResolvedValue(undefined);

    await expect(service.update('question-1', 'user-1', { question: 'New' })).resolves.toEqual(updated);
  });

  it('rejects edits by another user', async () => {
    repository.findOne.mockResolvedValue({ id: 'question-1', authorId: 'user-1' });

    await expect(service.update('question-1', 'user-2', { question: 'Changed' })).rejects.toThrow(ForbiddenException);
  });

  it('translates duplicate tag attachments into ConflictException', async () => {
    repository.findOne.mockResolvedValue({ id: 'question-1' });
    tagsService.findOneOrFail.mockResolvedValue({ id: 'tag-1' });
    repository.createQueryBuilder.mockReturnValue({
      relation: () => ({
        of: () => ({ add: vi.fn().mockRejectedValue({ code: '23505' }) }),
      }),
    });

    await expect(service.attachTag('question-1', 'tag-1')).rejects.toThrow(ConflictException);
  });
});
