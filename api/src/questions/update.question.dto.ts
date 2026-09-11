import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateQuestionDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    question?: string;
}
