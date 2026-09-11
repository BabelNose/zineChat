import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { Question } from './question.entity.js';
import { TagsService } from '../tags/tags.service.js';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questions: Question[];
  let attachedTags: Map<string, Set<string>>;

  beforeEach(async () => {
    questions = [];
    attachedTags = new Map();
    const tagsService = { findOneOrFail: async (id: string) => ({ id, tag: 'print' }) };
    const repository = {
      save: async (value: Partial<Question>) => {
        const existing = questions.find((question) => question.id === value.id);
        if (existing) return Object.assign(existing, value);
        const question = { id: `question-${questions.length + 1}`, ...value } as Question;
        questions.push(question);
        return question;
      },
      findOne: async ({ where }: any) => questions.find((question) => question.id === where.id) ?? null,
      createQueryBuilder: () => ({ relation: () => ({ of: (questionId: string) => ({
        add: async (tagId: string) => {
          const tags = attachedTags.get(questionId) ?? new Set<string>();
          if (tags.has(tagId)) throw { code: '23505' };
          tags.add(tagId);
          attachedTags.set(questionId, tags);
        },
        remove: async (tagId: string) => attachedTags.get(questionId)?.delete(tagId),
      }) }) }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getRepositoryToken(Question), useValue: repository },
        { provide: TagsService, useValue: tagsService },
      ],
    }).compile();
    service = module.get<QuestionsService>(QuestionsService);
  });

  it('creates and reads questions', async () => {
    const created = await service.create({ question: 'How do I bind a zine?' }, 'user-1');
    expect(created).toMatchObject({ id: 'question-1', question: 'How do I bind a zine?', authorId: 'user-1' });
  });

  it('rejects missing question lookups', async () => {
    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('allows the author to update a question', async () => {
    const created = await service.create({ question: 'Old' }, 'user-1');
    await expect(service.update(created.id, 'user-1', { question: 'New' })).resolves.toMatchObject({ question: 'New' });
  });

  it('rejects edits by another user without changing the question', async () => {
    const created = await service.create({ question: 'Original' }, 'user-1');
    await expect(service.update(created.id, 'user-2', { question: 'Changed' })).rejects.toThrow(ForbiddenException);
    await expect(service.findOneOrFail(created.id)).resolves.toEqual(created);
  });

  it('attaches and detaches tags', async () => {
    const question = await service.create({ question: 'Question' }, 'user-1');
    await service.attachTag(question.id, 'tag-1');
    expect(attachedTags.get(question.id)?.has('tag-1')).toBe(true);
    await service.detachTag(question.id, 'tag-1');
    expect(attachedTags.get(question.id)?.has('tag-1')).toBe(false);
  });

  it('rejects duplicate tag attachments and missing questions', async () => {
    const question = await service.create({ question: 'Question' }, 'user-1');
    await service.attachTag(question.id, 'tag-1');
    await expect(service.attachTag(question.id, 'tag-1')).rejects.toThrow(ConflictException);
    await expect(service.attachTag('missing', 'tag-1')).rejects.toThrow(NotFoundException);
  });
});
