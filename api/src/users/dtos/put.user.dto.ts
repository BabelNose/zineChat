export interface PutUserDto {
    email: string;
    avatar: string;
    username: string;
    password: string;
    permissionFlags: number;
}