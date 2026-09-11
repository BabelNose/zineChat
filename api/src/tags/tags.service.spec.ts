import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { Tag } from './tag.entity.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';

describe('TagsService', () => {
  let service: TagsService;
  let repository: any;

  beforeEach(async () => {
    repository = { save: vi.fn(), findOneBy: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: getRepositoryToken(Tag), useValue: repository }],
    }).compile();
    service = module.get<TagsService>(TagsService);
  });

  it('translates duplicate tag errors into ConflictException', async () => {
    repository.save.mockRejectedValue({ code: PG_UNIQUE_VIOLATION });

    await expect(service.create({ tag: 'print' })).rejects.toThrow(ConflictException);
  });

  it('translates missing tag lookups into NotFoundException', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('rejects updates for missing or duplicate tags', async () => {
    repository.findOneBy.mockResolvedValueOnce(null);
    await expect(service.update('missing', { tag: 'new-name' })).rejects.toThrow(NotFoundException);

    repository.findOneBy.mockResolvedValueOnce({ id: 'tag-1', tag: 'old-name' });
    repository.save.mockRejectedValue({ code: PG_UNIQUE_VIOLATION });
    await expect(service.update('tag-1', { tag: 'existing' })).rejects.toThrow(ConflictException);
  });

  it('translates a missing tag name lookup into NotFoundException', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findByNameOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('returns the existing tag without creating a new one', async () => {
    repository.findOneBy.mockResolvedValue({ id: 'tag-1', tag: 'existing' });
    repository.save.mockRejectedValue(new Error('should not attempt to create an existing tag'));

    await expect(service.findOrCreate('existing')).resolves.toEqual({ id: 'tag-1', tag: 'existing' });
  });

  it('creates and returns a new tag when none exists with that name', async () => {
    repository.findOneBy.mockResolvedValue(null);
    repository.save.mockImplementation((data: { tag: string }) => Promise.resolve({ id: 'generated-id', ...data }));

    await expect(service.findOrCreate('new-tag')).resolves.toEqual({ id: 'generated-id', tag: 'new-tag' });
  });

  it('resolves the existing tag when a concurrent request wins the create race', async () => {
    repository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'tag-3', tag: 'racer' });
    repository.save.mockRejectedValue({ code: PG_UNIQUE_VIOLATION });

    await expect(service.findOrCreate('racer')).resolves.toEqual({ id: 'tag-3', tag: 'racer' });
  });
});
