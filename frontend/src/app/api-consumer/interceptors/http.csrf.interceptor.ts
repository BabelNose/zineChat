import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { catchError, Observable, switchMap} from 'rxjs';
import { ApiService } from '../services';

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {
    constructor (private apiService: ApiService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if(req.method === "POST"){
            return this.apiService.get(`/auth/`)
                .pipe(switchMap((res) => {
                        req = req.clone({
                            headers: req.headers.set('x-csrf-token', res.token)
                        })
                        return next.handle(req);
                }),catchError((err, caught) => caught));
        }else{
            return next.handle(req);
        }
    }
}