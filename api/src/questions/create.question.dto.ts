import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    question: string;

    @IsOptional()
    @IsArray()
    @IsNotEmpty({ each: true })
    @IsString({ each: true })
    tags?: string[];
}
