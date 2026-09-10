import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnswerDto {
    @IsNotEmpty()
    @IsString()
    answer: string;
}
