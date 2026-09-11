import { Entity, Column } from 'typeorm';
import { UuidEntity } from '../common/uuid-entity.base.js';

@Entity()
export class Tag extends UuidEntity {
  @Column({ unique: true })
  tag: string;
}
