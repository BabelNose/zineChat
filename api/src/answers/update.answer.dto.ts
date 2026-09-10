import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAnswerDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    answer?: string;
}
