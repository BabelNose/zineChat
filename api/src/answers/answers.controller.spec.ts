import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnswersController } from './answers.controller.js';
import { AnswersService } from './answers.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

describe('AnswersController', () => {
  let controller: AnswersController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [
        {
          provide: AnswersService,
          useValue: {
            create: vi.fn(),
            findByQuestion: vi.fn(),
            findOneOrFail: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            awardMedal: vi.fn(),
            revokeMedal: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnswersController>(AnswersController);
    service = module.get(AnswersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create passes questionId, current user id and dto', async () => {
    const dto = { answer: 'text' };
    service.create.mockResolvedValue({ id: 'a-1', ...dto });

    const result = await controller.create('q-1', 'user-1', dto);

    expect(service.create).toHaveBeenCalledWith('q-1', dto, 'user-1');
    expect(result).toEqual({ id: 'a-1', ...dto });
  });

  it('findByQuestion delegates to service.findByQuestion', async () => {
    service.findByQuestion.mockResolvedValue([]);

    const result = await controller.findByQuestion('q-1');

    expect(service.findByQuestion).toHaveBeenCalledWith('q-1');
    expect(result).toEqual([]);
  });

  it('findOne delegates to service.findOneOrFail with full relations', async () => {
    service.findOneOrFail.mockResolvedValue({ id: 'a-1' });

    const result = await controller.findOne('a-1');

    expect(service.findOneOrFail).toHaveBeenCalledWith('a-1', ['author', 'question', 'medalAwarders']);
    expect(result).toEqual({ id: 'a-1' });
  });

  it('update passes id, current user id and dto', async () => {
    const dto = { answer: 'updated' };
    service.update.mockResolvedValue({ id: 'a-1', ...dto });

    const result = await controller.update('a-1', 'user-1', dto);

    expect(service.update).toHaveBeenCalledWith('a-1', 'user-1', dto);
    expect(result).toEqual({ id: 'a-1', ...dto });
  });

  it('remove passes id and current user id', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('a-1', 'user-1');

    expect(service.remove).toHaveBeenCalledWith('a-1', 'user-1');
  });

  it('awardMedal passes id and current user id', async () => {
    service.awardMedal.mockResolvedValue(undefined);

    await controller.awardMedal('a-1', 'user-2');

    expect(service.awardMedal).toHaveBeenCalledWith('a-1', 'user-2');
  });

  it('revokeMedal passes id and current user id', async () => {
    service.revokeMedal.mockResolvedValue(undefined);

    await controller.revokeMedal('a-1', 'user-2');

    expect(service.revokeMedal).toHaveBeenCalledWith('a-1', 'user-2');
  });
});
