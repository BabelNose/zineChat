import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('TagsController', () => {
  let controller: TagsController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOneOrFail: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TagsController>(TagsController);
    service = module.get(TagsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service.create', async () => {
    const dto = { tag: 'diyprint' };
    service.create.mockResolvedValue({ id: 'tag-1', ...dto });

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'tag-1', ...dto });
  });

  it('findAll delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue([]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('findOne delegates to service.findOneOrFail', async () => {
    service.findOneOrFail.mockResolvedValue({ id: 'tag-1', tag: 'diyprint' });

    const result = await controller.findOne('tag-1');

    expect(service.findOneOrFail).toHaveBeenCalledWith('tag-1');
    expect(result).toEqual({ id: 'tag-1', tag: 'diyprint' });
  });

  it('update delegates to service.update', async () => {
    const dto = { tag: 'new' };
    service.update.mockResolvedValue({ id: 'tag-1', ...dto });

    const result = await controller.update('tag-1', dto);

    expect(service.update).toHaveBeenCalledWith('tag-1', dto);
    expect(result).toEqual({ id: 'tag-1', ...dto });
  });

  it('remove delegates to service.remove', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('tag-1');

    expect(service.remove).toHaveBeenCalledWith('tag-1');
  });
});
