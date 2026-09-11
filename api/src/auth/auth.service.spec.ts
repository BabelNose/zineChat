import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { SecretService } from '../secret/secret.service.js';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { User } from '../users/user.entity.js';
import { CreateUserDto } from '../users/create.user.dto.js';
import { PG_UNIQUE_VIOLATION } from '../common/postgres-error-codes.js';
import { ZineSession } from './auth.types.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let secretService: any;
  let configService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmailWithPassword: vi.fn(),
            comparePassword: vi.fn(),
            addUser: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn(),
            verify: vi.fn(),
          },
        },
        {
          provide: SecretService,
          useValue: {
            get: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    secretService = module.get(SecretService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUser', () => {
    const testEmail = 'user@example.com';
    const testPassword = 'password123';
    const mockUserData: User = {
      id: '123-uuid',
      username: 'testuser',
      email: testEmail,
      password: 'hashedpassword',
      isActive: true,
    };

    it('should return user data (without password) when credentials are valid', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUserData);
      usersService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser(testEmail, testPassword);

      expect(result).toBeDefined();
      expect(result?.email).toBe(testEmail);
      expect(result?.username).toBe('testuser');
      expect(result?.id).toBe('123-uuid');
      expect(result?.password).toBeUndefined();
    });

    it('should return null when user does not exist', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.validateUser(testEmail, testPassword);

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUserData);
      usersService.comparePassword.mockResolvedValue(false);

      const result = await service.validateUser(testEmail, testPassword);

      expect(result).toBeNull();
    });

    it('should handle empty password edge case', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(mockUserData);
      usersService.comparePassword.mockResolvedValue(false);

      const result = await service.validateUser(testEmail, '');

      expect(result).toBeNull();
    });
  });
  
  describe('login', () => {
    const mockUser: User = {
      id: 'user-456',
      username: 'john',
      email: 'john@example.com',
      password: 'hashed',
      isActive: true,
    };

    beforeEach(() => {
      jwtService.sign.mockReturnValue('mock-jwt-token');
      secretService.get.mockReturnValue('mock-secret');
      configService.getOrThrow.mockReturnValue('7d');
    });

    it('should mutate session with token values', async () => {
      const session: Partial<ZineSession> = {};

      const result = await service.login(mockUser, session);

      expect(session.accessToken).toBe(result.accessToken);
      expect(session.refreshToken).toBe(result.refreshToken);
      expect(session.userId).toBe(mockUser.id);
    });

    it('should preserve existing session properties and add tokens', async () => {
      const session: any = { existingProp: 'value' };

      await service.login(mockUser, session);

      expect(session.existingProp).toBe('value');
      expect(session.accessToken).toBeDefined();
      expect(session.refreshToken).toBeDefined();
      expect(session.userId).toBe(mockUser.id);
    });

  });
  
  describe('logout', () => {
    it('should throw error when session.destroy fails', async () => {
      const destroyError = new Error('Session destruction failed');
      const mockSession: any = {
        destroy: vi.fn((callback) => callback(destroyError)),
      };

      await expect(service.logout(mockSession)).rejects.toThrow();
    });
  });

  describe('register', () => {
    const validDto: CreateUserDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'securepass123',
    };

    const createdUser: User = {
      id: 'new-uuid',
      username: validDto.username,
      email: validDto.email,
      password: 'hashed-password',
      isActive: true,
    };

    it('should return user data (without password) on successful registration', async () => {
      usersService.addUser.mockResolvedValue(createdUser);

      const result = await service.register(validDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(validDto.email);
      expect(result.username).toBe(validDto.username);
      expect(result.id).toBe('new-uuid');
    });

    it('should never expose password in returned user data', async () => {
      usersService.addUser.mockResolvedValue(createdUser);

      const result = await service.register(validDto);

      expect('password' in result).toBe(false);
    });

    it('should throw UnprocessableEntityException for duplicate email', async () => {
      const duplicateError = { code: PG_UNIQUE_VIOLATION, message: 'Unique violation' };
      usersService.addUser.mockRejectedValue(duplicateError);

      await expect(service.register(validDto)).rejects.toThrow(
        UnprocessableEntityException
      );
    });

    it('should throw error for validation failures from database', async () => {
      const validationError = new Error('Invalid data');
      usersService.addUser.mockRejectedValue(validationError);

      await expect(service.register(validDto)).rejects.toThrow(
        validationError.message
      );
    });

  });
  
  describe('refreshToken', () => {
    const validRefreshToken = 'valid-refresh-token';
    const userId = 'user-789';

    beforeEach(() => {
      jwtService.sign.mockReturnValue('new-token');
      secretService.get.mockReturnValue('refresh-secret');
      configService.getOrThrow.mockReturnValue('7d');
    });

    it('should mutate session with new token values', async () => {
      jwtService.verify.mockReturnValue({ id: userId });
      const session: Partial<ZineSession> = {};

      const result = await service.refreshToken(validRefreshToken, session);

      expect(session.accessToken).toBe(result.accessToken);
      expect(session.refreshToken).toBe(result.refreshToken);
    });

    it('should throw error when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const session: Partial<ZineSession> = {};

      await expect(
        service.refreshToken('invalid-token', session)
      ).rejects.toThrow();
    });

    it('should throw error when refresh token is expired', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });
      const session: Partial<ZineSession> = {};

      await expect(
        service.refreshToken(validRefreshToken, session)
      ).rejects.toThrow('Token expired');
    });

    it('should throw error when verification fails for any reason', async () => {
      const verificationErrors = [
        new Error('Token malformed'),
        new Error('Invalid signature'),
        new Error('Token not found'),
      ];

      for (const error of verificationErrors) {
        jwtService.verify.mockImplementationOnce(() => {
          throw error;
        });
        const session: Partial<ZineSession> = {};

        await expect(
          service.refreshToken(validRefreshToken, session)
        ).rejects.toThrow(error.message);
      }
    });

    it('should preserve existing session properties while updating tokens', async () => {
      jwtService.verify.mockReturnValue({ id: userId });
      const session: any = { existingData: 'preserved' };

      await service.refreshToken(validRefreshToken, session);

      expect(session.existingData).toBe('preserved');
      expect(session.accessToken).toBeDefined();
      expect(session.refreshToken).toBeDefined();
    });

    it('should handle edge case of empty refresh token string', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      const session: Partial<ZineSession> = {};

      await expect(
        service.refreshToken('', session)
      ).rejects.toThrow();
    });
  });
});
