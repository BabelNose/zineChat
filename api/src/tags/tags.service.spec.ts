import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { Tag } from './tag.entity.js';

describe('TagsService', () => {
  let service: TagsService;
  let tags: Tag[];

  beforeEach(async () => {
    tags = [];
    const repository = {
      save: async (value: Partial<Tag>) => {
        const existing = tags.find((tag) => tag.id === value.id);
        if (tags.some((tag) => tag.tag === value.tag && tag.id !== value.id)) throw { code: '23505' };
        if (existing) return Object.assign(existing, value);
        const tag = { id: `tag-${tags.length + 1}`, ...value } as Tag;
        tags.push(tag);
        return tag;
      },
      find: async () => [...tags].sort((a, b) => a.tag.localeCompare(b.tag)),
      findOneBy: async ({ id }: { id: string }) => tags.find((tag) => tag.id === id) ?? null,
      delete: async (id: string) => { tags = tags.filter((tag) => tag.id !== id); },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: getRepositoryToken(Tag), useValue: repository }],
    }).compile();
    service = module.get<TagsService>(TagsService);
  });

  it('creates a tag and makes it available through the public read API', async () => {
    const result = await service.create({ tag: 'print' });
    expect(result).toMatchObject({ id: 'tag-1', tag: 'print' });
    await expect(service.findAll()).resolves.toEqual([result]);
  });

  it('rejects duplicate tag names', async () => {
    await service.create({ tag: 'print' });
    await expect(service.create({ tag: 'print' })).rejects.toThrow(ConflictException);
  });

  it('returns tags in ascending name order', async () => {
    await service.create({ tag: 'zines' });
    await service.create({ tag: 'art' });
    expect((await service.findAll()).map((tag) => tag.tag)).toEqual(['art', 'zines']);
  });

  it('returns an existing tag and rejects missing tags', async () => {
    const tag = await service.create({ tag: 'print' });
    await expect(service.findOneOrFail(tag.id)).resolves.toEqual(tag);
    await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates an existing tag', async () => {
    const tag = await service.create({ tag: 'old-name' });
    await expect(service.update(tag.id, { tag: 'new-name' })).resolves.toMatchObject({ id: tag.id, tag: 'new-name' });
  });

  it('rejects updates for missing or duplicate tags', async () => {
    await expect(service.update('missing', { tag: 'new-name' })).rejects.toThrow(NotFoundException);
    await service.create({ tag: 'existing' });
    const second = await service.create({ tag: 'other' });
    await expect(service.update(second.id, { tag: 'existing' })).rejects.toThrow(ConflictException);
  });

  it('removes an existing tag and rejects removal of a missing tag', async () => {
    const tag = await service.create({ tag: 'print' });
    await service.remove(tag.id);
    await expect(service.findOneOrFail(tag.id)).rejects.toThrow(NotFoundException);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
