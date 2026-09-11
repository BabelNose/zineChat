import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Question } from '../questions/question.entity.js';
import { UuidV7Entity } from '../common/uuid-entity.base.js';

@Entity()
export class Comment extends UuidV7Entity {
  @Column('text')
  comment: string;

  @CreateDateColumn()
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
