import { Entity, Column } from 'typeorm';
import { UuidV7Entity } from '../common/uuid-entity.base.js';

@Entity()
export class Tag extends UuidV7Entity {
  @Column({ unique: true })
  tag: string;
}
