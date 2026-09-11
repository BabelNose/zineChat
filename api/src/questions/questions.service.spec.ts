import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { Question } from './question.entity.js';
import { TagsService } from '../tags/tags.service.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;
  let tagsService: any;

  beforeEach(async () => {
    repository = { findOne: vi.fn(), createQueryBuilder: vi.fn() };
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

  it('translates a missing question into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
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
        of: () => ({ add: vi.fn().mockRejectedValue({ code: PG_UNIQUE_VIOLATION }) }),
      }),
    });

    await expect(service.attachTag('question-1', 'tag-1')).rejects.toThrow(ConflictException);
  });
});
