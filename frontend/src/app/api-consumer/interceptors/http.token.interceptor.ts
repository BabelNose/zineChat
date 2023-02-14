import { Injectable, Injector } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { JwtService } from '../services';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private jwtService: JwtService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.jwtService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {Authorization: `Bearer ${token}`}
     });
    }

    return next.handle(req).pipe(catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (err.status !== 401) {
          throw new Error(err.error);
        }else{
          //Handle token refresh or redirect to home page
          console.log("401 unauthorized");
        }
      }
      return of(err.message);
    }
    ));
  }
}