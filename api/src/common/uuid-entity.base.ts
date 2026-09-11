import { PrimaryColumn } from 'typeorm';

export abstract class UuidEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;
}
