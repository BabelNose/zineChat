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
    repository = { save: vi.fn(), findOneBy: vi.fn(), delete: vi.fn() };
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
});
