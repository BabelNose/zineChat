import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    question: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    tagIds?: string[];
}
