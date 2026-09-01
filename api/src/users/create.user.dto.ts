import { IsString, IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message: 'The username must contain only alphanumeric characters, hyphens, and underscores',
    })
    username: string;
  
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}