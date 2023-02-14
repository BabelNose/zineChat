import { Injectable } from "@angular/core";
import { Token } from "../models";

@Injectable()
export class JwtService {

    getToken(): String {
        return window.localStorage['accessToken'];
      }
    
      saveToken(token: Token) {
        window.localStorage['accessToken'] = token.userId;
      }
    
      destroyToken() {
        window.localStorage.removeItem('accessToken');
      }
}