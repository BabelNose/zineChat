export interface CreateUserDto {
    email: string;
    username: string;
    password: string;
    avatar?: string;
    permissionFlags?: number;
}