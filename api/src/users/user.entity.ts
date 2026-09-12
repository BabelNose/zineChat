
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column()
  username: string; 

  @Column({ unique: true })
  email: string;
  
  @Column({select: false})
  password: string;

  @Column({ default: true })
  isActive: boolean;
}
