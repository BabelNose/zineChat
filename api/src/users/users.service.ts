import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { hash, verify } from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder("user")
    .select("user.email", email)
    .addSelect("user.password")
    .getOne()
  }

  async addUser(user: User): Promise<User> {
    
    user.password = await this.hashPassword(user.password);
    return this.usersRepository.save(user);
  }

  updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.usersRepository.save({ ...user, id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async hashPassword(password: string): Promise<string> {
    return await hash(password);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await verify(hashedPassword, password);
  }
}