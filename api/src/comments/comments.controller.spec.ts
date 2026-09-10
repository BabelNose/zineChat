import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            create: vi.fn(),
            findByQuestion: vi.fn(),
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

    controller = module.get<CommentsController>(CommentsController);
    service = module.get(CommentsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create passes questionId, current user id and dto', async () => {
    const dto = { comment: 'nice!' };
    service.create.mockResolvedValue({ id: 'c-1', ...dto });

    const result = await controller.create('q-1', 'user-1', dto);

    expect(service.create).toHaveBeenCalledWith('q-1', dto, 'user-1');
    expect(result).toEqual({ id: 'c-1', ...dto });
  });

  it('findByQuestion delegates to service.findByQuestion', async () => {
    service.findByQuestion.mockResolvedValue([]);

    const result = await controller.findByQuestion('q-1');

    expect(service.findByQuestion).toHaveBeenCalledWith('q-1');
    expect(result).toEqual([]);
  });

  it('findOne delegates to service.findOneOrFail with relations', async () => {
    service.findOneOrFail.mockResolvedValue({ id: 'c-1' });

    const result = await controller.findOne('c-1');

    expect(service.findOneOrFail).toHaveBeenCalledWith('c-1', ['author', 'question']);
    expect(result).toEqual({ id: 'c-1' });
  });

  it('update passes id, current user id and dto', async () => {
    const dto = { comment: 'updated' };
    service.update.mockResolvedValue({ id: 'c-1', ...dto });

    const result = await controller.update('c-1', 'user-1', dto);

    expect(service.update).toHaveBeenCalledWith('c-1', 'user-1', dto);
    expect(result).toEqual({ id: 'c-1', ...dto });
  });

  it('remove passes id and current user id', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('c-1', 'user-1');

    expect(service.remove).toHaveBeenCalledWith('c-1', 'user-1');
  });
});
