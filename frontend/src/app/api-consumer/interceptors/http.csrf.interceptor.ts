import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionService } from '../services';

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {
    constructor (private sessionService: SessionService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if(req.method === "POST"){
            let csrfToken = '';
            if(this.sessionService.hasToken){
                csrfToken = this.sessionService.getCsrfToken();
            }
            req = req.clone({
                headers: req.headers.set('x-csrf-token', csrfToken)
            })
            return next.handle(req);
        }else{
            return next.handle(req);
        }
    }
}