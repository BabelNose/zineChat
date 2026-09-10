import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { Tag } from './tag.entity.js';

describe('TagsService', () => {
  let service: TagsService;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            save: vi.fn(),
            find: vi.fn(),
            findOneBy: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    repository = module.get(getRepositoryToken(Tag));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('saves and returns the new tag', async () => {
      const dto = { tag: 'diyprint' };
      const savedTag = { id: 'tag-1', ...dto };
      repository.save.mockResolvedValue(savedTag);

      const result = await service.create(dto);

      expect(repository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(savedTag);
    });

    it('throws ConflictException on duplicate tag name', async () => {
      repository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create({ tag: 'diyprint' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all tags ordered by name', async () => {
      const tags = [{ id: '1', tag: 'a' }];
      repository.find.mockResolvedValue(tags);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { tag: 'ASC' } });
      expect(result).toEqual(tags);
    });
  });

  describe('findOneOrFail', () => {
    it('returns the tag when found', async () => {
      const tag = { id: 'tag-1', tag: 'diyprint' };
      repository.findOneBy.mockResolvedValue(tag);

      const result = await service.findOneOrFail('tag-1');

      expect(result).toEqual(tag);
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns the tag', async () => {
      repository.findOneBy
        .mockResolvedValueOnce({ id: 'tag-1', tag: 'old' })
        .mockResolvedValueOnce({ id: 'tag-1', tag: 'new' });
      repository.save.mockResolvedValue(undefined);

      const result = await service.update('tag-1', { tag: 'new' });

      expect(repository.save).toHaveBeenCalledWith({ tag: 'new', id: 'tag-1' });
      expect(result).toEqual({ id: 'tag-1', tag: 'new' });
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update('missing', { tag: 'new' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the tag when it exists', async () => {
      repository.findOneBy.mockResolvedValue({ id: 'tag-1', tag: 'diyprint' });

      await service.remove('tag-1');

      expect(repository.delete).toHaveBeenCalledWith('tag-1');
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
