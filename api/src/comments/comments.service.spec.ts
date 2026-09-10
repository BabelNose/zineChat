import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { Comment } from './comment.entity.js';
import { QuestionsService } from '../questions/questions.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: any;
  let questionsService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            delete: vi.fn(),
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

    service = module.get<CommentsService>(CommentsService);
    repository = module.get(getRepositoryToken(Comment));
    questionsService = module.get(QuestionsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates the comment once the question exists', async () => {
      questionsService.findOneOrFail.mockResolvedValue({ id: 'q-1' });
      repository.save.mockResolvedValue({ id: 'c-1' });
      repository.findOne.mockResolvedValue({ id: 'c-1', comment: 'nice!', questionId: 'q-1' });

      const result = await service.create('q-1', { comment: 'nice!' }, 'user-1');

      expect(questionsService.findOneOrFail).toHaveBeenCalledWith('q-1');
      expect(repository.save).toHaveBeenCalledWith({ comment: 'nice!', questionId: 'q-1', authorId: 'user-1' });
      expect(result).toEqual({ id: 'c-1', comment: 'nice!', questionId: 'q-1' });
    });

    it('propagates NotFoundException when the question does not exist', async () => {
      questionsService.findOneOrFail.mockRejectedValue(new NotFoundException('Question not found'));

      await expect(service.create('missing', { comment: 'nice!' }, 'user-1')).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByQuestion', () => {
    it('returns comments for an existing question ordered by created', async () => {
      questionsService.findOneOrFail.mockResolvedValue({ id: 'q-1' });
      const comments = [{ id: 'c-1' }];
      repository.find.mockResolvedValue(comments);

      const result = await service.findByQuestion('q-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { questionId: 'q-1' },
        relations: ['author'],
        order: { created: 'ASC' },
      });
      expect(result).toEqual(comments);
    });
  });

  describe('update', () => {
    it('updates the comment when the caller is the author', async () => {
      repository.findOne
        .mockResolvedValueOnce({ id: 'c-1', authorId: 'user-1' })
        .mockResolvedValueOnce({ id: 'c-1', comment: 'updated' });
      repository.save.mockResolvedValue(undefined);

      const result = await service.update('c-1', 'user-1', { comment: 'updated' });

      expect(repository.save).toHaveBeenCalledWith({ comment: 'updated', id: 'c-1' });
      expect(result).toEqual({ id: 'c-1', comment: 'updated' });
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'c-1', authorId: 'user-1' });

      await expect(service.update('c-1', 'someone-else', { comment: 'updated' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the comment when the caller is the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'c-1', authorId: 'user-1' });

      await service.remove('c-1', 'user-1');

      expect(repository.delete).toHaveBeenCalledWith('c-1');
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'c-1', authorId: 'user-1' });

      await expect(service.remove('c-1', 'someone-else')).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
