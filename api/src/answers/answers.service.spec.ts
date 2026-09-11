import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnswersService } from './answers.service.js';
import { Answer } from './answer.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('AnswersService', () => {
  let service: AnswersService;
  let repository: any;
  let questionsService: any;

  beforeEach(async () => {
    repository = {
      save: vi.fn(),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    questionsService = {
      findOneOrFail: vi.fn(),
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

  it('creates an answer with its question and author context', async () => {
    const savedAnswer = { id: 'answer-1' };
    const hydratedAnswer = {
      id: 'answer-1',
      answer: 'Use a bone folder.',
      questionId: 'question-1',
      authorId: 'user-1',
    } as Answer;
    questionsService.findOneOrFail.mockResolvedValue({ id: 'question-1' });
    repository.save.mockResolvedValue(savedAnswer);
    repository.findOne.mockResolvedValue(hydratedAnswer);

    const result = await service.create(
      'question-1',
      { answer: 'Use a bone folder.' },
      'user-1',
    );

    expect(result).toEqual(hydratedAnswer);
  });

  it('rejects answers for a missing question', async () => {
    questionsService.findOneOrFail.mockRejectedValue(new NotFoundException('Question not found'));

    await expect(
      service.create('missing', { answer: 'Nope' }, 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('translates a missing answer into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates an answer owned by the current user', async () => {
    const existingAnswer = { id: 'answer-1', authorId: 'user-1' } as Answer;
    const updatedAnswer = { ...existingAnswer, answer: 'New' } as Answer;
    repository.findOne
      .mockResolvedValueOnce(existingAnswer)
      .mockResolvedValueOnce(updatedAnswer);
    repository.save.mockResolvedValue(undefined);

    await expect(service.update('answer-1', 'user-1', { answer: 'New' })).resolves.toEqual(updatedAnswer);
  });

  it('rejects updates by another user', async () => {
    repository.findOne.mockResolvedValue({ id: 'answer-1', authorId: 'user-1' });

    await expect(
      service.update('answer-1', 'user-2', { answer: 'Changed' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('translates a duplicate medal error into ConflictException', async () => {
    repository.findOne.mockResolvedValue({ id: 'answer-1' });
    repository.createQueryBuilder.mockReturnValue({
      relation: () => ({
        of: () => ({
          add: vi.fn().mockRejectedValue({ code: '23505' }),
        }),
      }),
    });

    await expect(service.awardMedal('answer-1', 'user-2')).rejects.toThrow(ConflictException);
  });

  it('rejects revoking a medal that is not awarded to the user', async () => {
    repository.findOne.mockResolvedValue({ id: 'answer-1' });
    repository.createQueryBuilder.mockReturnValue({
      relation: () => ({
        of: () => ({
          loadMany: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.revokeMedal('answer-1', 'user-2')).rejects.toThrow(NotFoundException);
  });
});
