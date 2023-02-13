import { Injectable } from "@angular/core";
import { Token, TokenPayload } from "../models";
import jwt_decode from 'jwt-decode';

@Injectable()
export class JwtService {

    jwtToken: string = '';
    decodedToken: TokenPayload = {userId:'', email:'', permissionFlags:0};

    getToken(): string{
        return this.jwtToken;
    }

    getPayload():TokenPayload {
        return this.decodedToken;
    }

    saveToken(token: Token) {
        if (token) {
            this.jwtToken = token.accessToken;
            const payload:any = jwt_decode(token.accessToken);
            this.decodedToken = {
                userId:payload.userId,
                email: payload.email,
                permissionFlags: payload.permissionFlags
            }
        }
    }
    destroyToken() {
        this.jwtToken = '';
        this.decodedToken = {userId:'', email:'', permissionFlags:0}
    }
}