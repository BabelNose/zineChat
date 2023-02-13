export interface Token {
    accessToken:string
}

export interface TokenPayload {
    userId:string,
    email: string,
    permissionFlags: number,
}