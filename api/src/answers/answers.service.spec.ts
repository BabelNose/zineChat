import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnswersService } from './answers.service.js';
import { Answer } from './answer.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('AnswersService', () => {
  let service: AnswersService;
  let answers: Answer[];
  let questions: Set<string>;
  let medals: Map<string, Set<string>>;

  beforeEach(async () => {
    answers = [];
    questions = new Set(['question-1']);
    medals = new Map();
    const questionsService = { findOneOrFail: async (id: string) => {
      if (!questions.has(id)) throw new NotFoundException('Question not found');
      return { id };
    } };
    const repository = {
      save: async (value: Partial<Answer>) => {
        const existing = answers.find((answer) => answer.id === value.id);
        if (existing) return Object.assign(existing, value);
        const answer = { id: `answer-${answers.length + 1}`, ...value } as Answer;
        answers.push(answer);
        return answer;
      },
      find: async ({ where }: any) => answers.filter((answer) => answer.questionId === where.questionId),
      findOne: async ({ where }: any) => answers.find((answer) => answer.id === where.id) ?? null,
      createQueryBuilder: () => ({ relation: () => ({ of: (answerId: string) => ({
        add: async (userId: string) => {
          const users = medals.get(answerId) ?? new Set<string>();
          if (users.has(userId)) throw { code: '23505' };
          users.add(userId);
          medals.set(answerId, users);
        },
        loadMany: async () => [...(medals.get(answerId) ?? new Set<string>())].map((id) => ({ id })),
        remove: async (userId: string) => medals.get(answerId)?.delete(userId),
      }) }) }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        { provide: getRepositoryToken(Answer), useValue: repository },
        { provide: QuestionsService, useValue: questionsService },
      ],
    }).compile();
    service = module.get<AnswersService>(AnswersService);
  });

  it('creates and reads an answer for an existing question', async () => {
    const result = await service.create('question-1', { answer: 'Use a bone folder.' }, 'user-1');
    expect(result).toMatchObject({ id: 'answer-1', answer: 'Use a bone folder.', questionId: 'question-1', authorId: 'user-1' });
    await expect(service.findByQuestion('question-1')).resolves.toEqual([result]);
  });

  it('rejects answers for a missing question', async () => {
    await expect(service.create('missing', { answer: 'Nope' }, 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects missing answer lookups', async () => {
    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('allows the author to update an answer', async () => {
    const answer = await service.create('question-1', { answer: 'Old' }, 'user-1');
    await expect(service.update(answer.id, 'user-1', { answer: 'New' })).resolves.toMatchObject({ answer: 'New' });
  });

  it('rejects edits by another user without changing the answer', async () => {
    const answer = await service.create('question-1', { answer: 'Original' }, 'user-1');
    await expect(service.update(answer.id, 'user-2', { answer: 'Changed' })).rejects.toThrow(ForbiddenException);
    await expect(service.findOneOrFail(answer.id)).resolves.toEqual(answer);
  });

  it('awards and revokes a medal', async () => {
    const answer = await service.create('question-1', { answer: 'Helpful' }, 'user-1');
    await service.awardMedal(answer.id, 'user-2');
    expect(medals.get(answer.id)?.has('user-2')).toBe(true);
    await service.revokeMedal(answer.id, 'user-2');
    expect(medals.get(answer.id)?.has('user-2')).toBe(false);
  });

  it('rejects duplicate medals and revoking a missing medal', async () => {
    const answer = await service.create('question-1', { answer: 'Helpful' }, 'user-1');
    await service.awardMedal(answer.id, 'user-2');
    await expect(service.awardMedal(answer.id, 'user-2')).rejects.toThrow(ConflictException);
    await expect(service.revokeMedal(answer.id, 'someone-else')).rejects.toThrow(NotFoundException);
  });
});
