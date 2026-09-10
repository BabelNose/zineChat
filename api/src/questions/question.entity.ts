
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column("text")
  question: string; 

  @Column({
    type: "date",
    utc: true
  })
  created: Date;
}