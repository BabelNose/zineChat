import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service.js';
import { Question } from './question.entity.js';
import { TagsService } from '../tags/tags.service.js';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let repository: any;
  let tagsService: any;
  let relationBuilder: any;

  beforeEach(async () => {
    relationBuilder = {
      of: vi.fn().mockReturnThis(),
      add: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: getRepositoryToken(Question),
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
          provide: TagsService,
          useValue: {
            findOneOrFail: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
    repository = module.get(getRepositoryToken(Question));
    tagsService = module.get(TagsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('saves with the given authorId and returns the hydrated question', async () => {
      const dto = { question: 'How do I start a zine?' };
      repository.save.mockResolvedValue({ id: 'q-1' });
      repository.findOne.mockResolvedValue({ id: 'q-1', ...dto, authorId: 'user-1' });

      const result = await service.create(dto, 'user-1');

      expect(repository.save).toHaveBeenCalledWith({ ...dto, authorId: 'user-1' });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'q-1' }, relations: ['author'] });
      expect(result).toEqual({ id: 'q-1', ...dto, authorId: 'user-1' });
    });
  });

  describe('findOneOrFail', () => {
    it('returns the question when found', async () => {
      const question = { id: 'q-1', authorId: 'user-1' };
      repository.findOne.mockResolvedValue(question);

      const result = await service.findOneOrFail('q-1');

      expect(result).toEqual(question);
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the question when the caller is the author', async () => {
      repository.findOne
        .mockResolvedValueOnce({ id: 'q-1', authorId: 'user-1' })
        .mockResolvedValueOnce({ id: 'q-1', question: 'updated' });
      repository.save.mockResolvedValue(undefined);

      const result = await service.update('q-1', 'user-1', { question: 'updated' });

      expect(repository.save).toHaveBeenCalledWith({ question: 'updated', id: 'q-1' });
      expect(result).toEqual({ id: 'q-1', question: 'updated' });
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1', authorId: 'user-1' });

      await expect(service.update('q-1', 'someone-else', { question: 'updated' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the question when the caller is the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1', authorId: 'user-1' });

      await service.remove('q-1', 'user-1');

      expect(repository.delete).toHaveBeenCalledWith('q-1');
    });

    it('throws ForbiddenException when the caller is not the author', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1', authorId: 'user-1' });

      await expect(service.remove('q-1', 'someone-else')).rejects.toThrow(ForbiddenException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('attachTag', () => {
    it('attaches the tag once both question and tag exist', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1' });
      tagsService.findOneOrFail.mockResolvedValue({ id: 'tag-1' });

      await service.attachTag('q-1', 'tag-1');

      expect(relationBuilder.of).toHaveBeenCalledWith('q-1');
      expect(relationBuilder.add).toHaveBeenCalledWith('tag-1');
    });

    it('throws ConflictException when the tag is already attached', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1' });
      tagsService.findOneOrFail.mockResolvedValue({ id: 'tag-1' });
      relationBuilder.add.mockRejectedValue({ code: '23505' });

      await expect(service.attachTag('q-1', 'tag-1')).rejects.toThrow(ConflictException);
    });

    it('propagates NotFoundException when the question is missing', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.attachTag('missing', 'tag-1')).rejects.toThrow(NotFoundException);
      expect(relationBuilder.add).not.toHaveBeenCalled();
    });
  });

  describe('detachTag', () => {
    it('removes the tag from the question', async () => {
      repository.findOne.mockResolvedValue({ id: 'q-1' });
      tagsService.findOneOrFail.mockResolvedValue({ id: 'tag-1' });

      await service.detachTag('q-1', 'tag-1');

      expect(relationBuilder.of).toHaveBeenCalledWith('q-1');
      expect(relationBuilder.remove).toHaveBeenCalledWith('tag-1');
    });
  });
});
