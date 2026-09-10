import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QuestionsController } from './questions.controller.js';
import { QuestionsService } from './questions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOneDetailed: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            attachTag: vi.fn(),
            detachTag: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuestionsController>(QuestionsController);
    service = module.get(QuestionsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create passes the current user id as author', async () => {
    const dto = { question: 'How do I start a zine?' };
    service.create.mockResolvedValue({ id: 'q-1', ...dto });

    const result = await controller.create('user-1', dto);

    expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    expect(result).toEqual({ id: 'q-1', ...dto });
  });

  it('findAll delegates to service.findAll', async () => {
    service.findAll.mockResolvedValue([]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('findOne delegates to service.findOneDetailed', async () => {
    service.findOneDetailed.mockResolvedValue({ id: 'q-1' });

    const result = await controller.findOne('q-1');

    expect(service.findOneDetailed).toHaveBeenCalledWith('q-1');
    expect(result).toEqual({ id: 'q-1' });
  });

  it('update passes id, current user id and dto', async () => {
    const dto = { question: 'updated' };
    service.update.mockResolvedValue({ id: 'q-1', ...dto });

    const result = await controller.update('q-1', 'user-1', dto);

    expect(service.update).toHaveBeenCalledWith('q-1', 'user-1', dto);
    expect(result).toEqual({ id: 'q-1', ...dto });
  });

  it('remove passes id and current user id', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('q-1', 'user-1');

    expect(service.remove).toHaveBeenCalledWith('q-1', 'user-1');
  });

  it('attachTag delegates to service.attachTag', async () => {
    service.attachTag.mockResolvedValue(undefined);

    await controller.attachTag('q-1', 'tag-1');

    expect(service.attachTag).toHaveBeenCalledWith('q-1', 'tag-1');
  });

  it('detachTag delegates to service.detachTag', async () => {
    service.detachTag.mockResolvedValue(undefined);

    await controller.detachTag('q-1', 'tag-1');

    expect(service.detachTag).toHaveBeenCalledWith('q-1', 'tag-1');
  });
});
