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

  beforeEach(async () => {
    repository = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        { provide: getRepositoryToken(Answer), useValue: repository },
        { provide: QuestionsService, useValue: {} },
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
  });

  it('translates a missing answer into NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
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
