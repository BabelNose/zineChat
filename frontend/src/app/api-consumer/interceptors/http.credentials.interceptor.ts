import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable} from 'rxjs';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('before',request);
        request = request.clone({
            withCredentials: true
        });
        console.log('after',request);
        return next.handle(request);
    }
}