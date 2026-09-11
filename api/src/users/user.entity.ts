
import { Entity, Column } from 'typeorm';
import { UuidV7Entity } from '../common/uuid-entity.base.js';

@Entity()
export class User extends UuidV7Entity {
  @Column()
  username: string; 

  @Column({ unique: true })
  email: string;
  
  @Column({select: false})
  password: string;

  @Column({ default: true })
  isActive: boolean;
}
