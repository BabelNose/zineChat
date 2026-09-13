import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Question } from '../questions/question.entity.js';

@Entity()
@Index(['questionId', 'id'])
export class Comment {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column('text')
  comment: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('uuid')
  questionId: string;

  @ManyToOne('Question', (question: Question) => question.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}
