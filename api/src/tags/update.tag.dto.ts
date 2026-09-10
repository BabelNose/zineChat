import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTagDto {
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    tag?: string;
}
