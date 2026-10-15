import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { Tag } from './tag.entity.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';
import { ISearchProvider } from '../search/search.provider.interface.js';

describe('TagsService', () => {
  let service: TagsService;
  let repository: any;
  let searchProvider: any;

  beforeEach(async () => {
    repository = { save: vi.fn(), findOneBy: vi.fn() };
    searchProvider = { search: vi.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: repository },
        { provide: ISearchProvider, useValue: searchProvider },
      ],
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

  it('translates removal of a missing tag into NotFoundException', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('resolves the existing tag when a concurrent request wins the create race', async () => {
    repository.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'tag-3', tag: 'racer' });
    repository.save.mockRejectedValue({ code: PG_UNIQUE_VIOLATION });

    await expect(service.findOrCreate('racer')).resolves.toEqual({ id: 'tag-3', tag: 'racer' });
  });

  it('returns matching tags with no next cursor when there are no more hits than the limit', async () => {
    searchProvider.search.mockResolvedValue([{ indexUid: 'zine_tag', document: { id: 'tag-1', tag: 'typescript' } }]);

    const result = await service.search({ q: 'type', limit: 5 } as any);

    expect(result).toEqual({ items: [{ id: 'tag-1', tag: 'typescript' }], nextCursor: null });
  });

  it('returns a next cursor and trims the page when more hits exist than the limit', async () => {
    searchProvider.search.mockResolvedValue([
      { indexUid: 'zine_tag', document: { id: 'tag-1', tag: 'a' } },
      { indexUid: 'zine_tag', document: { id: 'tag-2', tag: 'b' } },
    ]);

    const result = await service.search({ q: 'a', limit: 1 } as any);

    expect(result).toEqual({ items: [{ id: 'tag-1', tag: 'a' }], nextCursor: '1' });
  });

  it('rejects a cursor that is not a non-negative integer', async () => {
    await expect(service.search({ q: 'a', cursor: 'not-a-number' } as any)).rejects.toThrow(BadRequestException);
    await expect(service.search({ q: 'a', cursor: '-1' } as any)).rejects.toThrow(BadRequestException);
  });
});
