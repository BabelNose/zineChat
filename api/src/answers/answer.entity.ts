import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Question } from '../questions/question.entity.js';

@Entity()
export class Answer {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column('text')
  answer: string;

  @CreateDateColumn()
  created: Date;

  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column('uuid')
  questionId: string;

  @ManyToOne('Question', (question: Question) => question.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'answer_medals',
    joinColumn: { name: 'answer_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  medalAwarders: User[];
}
