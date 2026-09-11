
import { Entity, Column } from 'typeorm';
import { UuidEntity } from '../common/uuid-entity.base.js';

@Entity()
export class User extends UuidEntity {
  @Column()
  username: string; 

  @Column({ unique: true })
  email: string;
  
  @Column({select: false})
  password: string;

  @Column({ default: true })
  isActive: boolean;
}
