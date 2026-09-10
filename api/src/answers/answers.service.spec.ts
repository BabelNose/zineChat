import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AnswersService } from './answers.service.js';
import { Answer } from './answer.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('AnswersService', () => {
  let service: AnswersService;
  let repository: any;
  let questionsService: any;
  let relationBuilder: any;

  beforeEach(async () => {
    relationBuilder = {
      of: vi.fn().mockReturnThis(),
      add: vi.fn(),
      remove: vi.fn(),
      loadMany: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        {
          provide: getRepositoryToken(Answer),
          useValue: {
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: vi.fn().mockReturnValue({
              relation: vi.fn().mockReturnValue(relationBuilder),
            }),
          },
        },
        {
          provide: QuestionsService,
          useValue: {
            findOneOrFail: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
    repository = module.get(getRepositoryToken(Answer));
    questionsService = module.get(QuestionsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates the answer once the question exists', async () => {
      questionsService.findOneOrFail.mockResolvedValue({ id: 'q-1' });
      repository.save.mockResolvedValue({ id: 'a-1' });
      repository.findOne.mockResolvedValue({ id: 'a-1', answer: 'text', questionId: 'q-1' });

      const result = await service.create('q-1', { answer: 'text' }, 'user-1');

      expect(questionsService.findOneOrFail).toHaveBeenCalledWith('q-1');
      expect(repository.save).toHaveBeenCalledWith({ answer: 'text', questionId: 'q-1', authorId: 'user-1' });
      expect(result).toEqual({ id: 'a-1', answer: 'text', questionId: 'q-1' });
    });

    it('propagates NotFoundException when the question does not exist', async () => {
      questionsService.findOneOrFail.mockRejectedValue(new NotFoundException('Question not found'));

      await expect(service.create('missing', { answer: 'text' }, 'user-1')).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByQuestion', () => {
    it('returns answers for an existing question ordered by created', async () => {
      questionsService.findOneOrFail.mockResolvedValue({ id: 'q-1' });
      const answers = [{ id: 'a-1' }];
      repository.find.mockResolvedValue(answers);

      const result = await service.findByQuestion('q-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        relations: ['author', 'medalAwarders'],
        order: { created: 'ASC' },
      });
      expect(result).toEqual(answers);
    });
  });

  describe('update', () => {
    it('updates the answer when the caller is the author', async () => {
      repository.findOne
        .mockResolvedValueOnce({ id: 'a-1', authorId: 'user-1' })
        .mockResolvedValueOnce({ id: 'a-1', answer: 'updated' });
      repository.save.mockResolvedValue(undefined);

      const result = await service.update('a-1', 'user-1', { answer: 'updated' });

      expect(repository.save).toHaveBeenCalledWith({ answer: 'updated', id: 'a-1' });
      expect(result).toEqual({ id: 'a-1', answer: 'updated' });
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1', authorId: 'user-1' });

      await expect(service.update('a-1', 'someone-else', { answer: 'updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the answer when the caller is the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1', authorId: 'user-1' });

      await service.remove('a-1', 'user-1');

      expect(repository.delete).toHaveBeenCalledWith('a-1');
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1', authorId: 'user-1' });

      await expect(service.remove('a-1', 'someone-else')).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('awardMedal', () => {
    it('adds the user to the answer medal awarders', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1' });

      await service.awardMedal('a-1', 'user-2');

      expect(relationBuilder.of).toHaveBeenCalledWith('a-1');
      expect(relationBuilder.add).toHaveBeenCalledWith('user-2');
    });

    it('throws ConflictException when the medal was already awarded', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1' });
      relationBuilder.add.mockRejectedValue({ code: '23505' });

      await expect(service.awardMedal('a-1', 'user-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('revokeMedal', () => {
    it('removes the user from the answer medal awarders', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1' });
      relationBuilder.loadMany.mockResolvedValue([{ id: 'user-2' }]);

      await service.revokeMedal('a-1', 'user-2');

      expect(relationBuilder.remove).toHaveBeenCalledWith('user-2');
    });

    it('throws NotFoundException when the user never awarded a medal', async () => {
      repository.findOne.mockResolvedValue({ id: 'a-1' });
      relationBuilder.loadMany.mockResolvedValue([{ id: 'someone-else' }]);

      await expect(service.revokeMedal('a-1', 'user-2')).rejects.toThrow(NotFoundException);
      expect(relationBuilder.remove).not.toHaveBeenCalled();
    });
  });
});
