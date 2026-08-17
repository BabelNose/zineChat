import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const testUsers: User[] = [
    {
      id: 1,
      userName: 'testuser1',
      email: 'testuser1@example.com',
      password: 'testpassword1',
      isActive: true,
    },
    {
      id: 2,
      userName: 'testuser2',
      email: 'testuser2@example.com',
      password: 'testpassword2',
      isActive: true,
    }
  ];

  const mockRepository = {
      find: jest.fn().mockResolvedValue([testUsers[0], testUsers[1]]),
      findOneBy: jest.fn().mockResolvedValue(testUsers[0]),
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(testUsers[0]),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(testUsers[0]),
      }),
    };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService, 
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
      
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an array of users', async () => {
    const users = await service.findAll();
    expect(users).toEqual([testUsers[0], testUsers[1]]);
  });

  it('should return a user by id', async () => {
    const user = await service.findOne(1);
    expect(user).toEqual(testUsers[0]);
  });

  it('should remove a user by id', async () => {
    const user = await service.remove(1);
    expect(user).toBeUndefined();
  });

  it('should add a user', async () => {
    const spyHashPassword = jest.spyOn(service, 'hashPassword');
    const originalPassword = testUsers[0].password;
    await service.addUser(testUsers[0]);
    expect(spyHashPassword).toHaveBeenCalledWith(originalPassword);
  });

  it('should return a user by email with the password', async () => {
    const user = await service.findByEmailWithPassword('testuser1@example.com');
    expect(user).toEqual(testUsers[0]);
    expect(user).toHaveProperty('password');
  });
  
});
