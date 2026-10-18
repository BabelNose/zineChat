import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Answer } from '../answers/answer.entity.js';
import type { Comment } from '../comments/comment.entity.js';
import { Tag } from '../tags/tag.entity.js';

@Entity()
export class Question {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column('text')
  question: string;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
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

  // Denormalized search read-model, maintained by Postgres triggers (not app
  // code) so Ventstream can mirror it straight into the zine_question
  // Meilisearch index - see api/scripts/sync-search-cache.sql. `update: false`
  // keeps TypeORM from ever writing to these columns itself.
  @Column({ type: 'int', default: 0, update: false })
  answerCount: number;

  @Column({ type: 'int', default: 0, update: false })
  commentCount: number;

  @Column({ type: 'jsonb', default: () => "'[]'", update: false })
  tagsCache: { id: string; tag: string }[];
}
