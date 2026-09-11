import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Tag {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Column({ unique: true })
  tag: string;
}
