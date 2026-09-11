import { PrimaryColumn } from 'typeorm';

export abstract class UuidV7Entity {
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;
}
