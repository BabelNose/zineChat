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
    repository = { findOne: vi.fn(), save: vi.fn(), createQueryBuilder: vi.fn() };
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

  // Minimal stand-in for the TypeORM relation query builder: records which tag
  // ids were actually passed to `add`, so tests can assert on the service's
  // public return value instead of on the mock's call arguments.
  function tagRelationStub() {
    const attached: string[] = [];
    return {
      attached,
      queryBuilder: {
        relation: () => ({
          of: () => ({
            add: (ids: string | string[]) => {
              attached.push(...(Array.isArray(ids) ? ids : [ids]));
              return Promise.resolve();
            },
          }),
        }),
      },
    };
  }

  it('attaches the given tags, deduplicated, when creating a question', async () => {
    const stub = tagRelationStub();
    repository.save.mockResolvedValue({ id: 'question-1' });
    repository.createQueryBuilder.mockReturnValue(stub.queryBuilder);
    tagsService.findOneOrFail.mockImplementation((id: string) => Promise.resolve({ id }));
    repository.findOne.mockImplementation(() =>
      Promise.resolve({ id: 'question-1', tags: stub.attached.map((id) => ({ id })) }),
    );

    const question = await service.create({ question: 'Q', tagIds: ['tag-1', 'tag-1', 'tag-2'] }, 'user-1');

    expect(question.tags).toEqual([{ id: 'tag-1' }, { id: 'tag-2' }]);
  });

  it('rejects question creation when a tag does not exist', async () => {
    repository.save.mockResolvedValue({ id: 'question-1' });
    tagsService.findOneOrFail.mockRejectedValue(new NotFoundException('Tag not found'));

    await expect(
      service.create({ question: 'Q', tagIds: ['missing-tag'] }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates a question without attaching any tags when none are provided', async () => {
    const stub = tagRelationStub();
    repository.save.mockResolvedValue({ id: 'question-1' });
    repository.createQueryBuilder.mockReturnValue(stub.queryBuilder);
    repository.findOne.mockImplementation(() =>
      Promise.resolve({ id: 'question-1', tags: stub.attached.map((id) => ({ id })) }),
    );

    const question = await service.create({ question: 'Q' }, 'user-1');

    expect(question.tags).toEqual([]);
  });
});
