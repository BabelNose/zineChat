import { Entity, Column, CreateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Answer } from '../answers/answer.entity.js';
import type { Comment } from '../comments/comment.entity.js';
import { Tag } from '../tags/tag.entity.js';
import { UuidEntity } from '../common/uuid-entity.base.js';

@Entity()
export class Question extends UuidEntity {
  @Column('text')
  question: string;

  @CreateDateColumn()
  created: Date;

  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany('Answer', (answer: Answer) => answer.question)
  answers: Answer[];

  @OneToMany('Comment', (comment: Comment) => comment.question)
  comments: Comment[];

  @ManyToMany(() => Tag, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'question_tag',
    joinColumn: { name: 'question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
