import { Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable, ReplaySubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable()
export class SessionService {
    private csrfTokenSubject = new BehaviorSubject<string>('');
    public csrfToken = this.csrfTokenSubject.asObservable();

    private hasTokenSubject = new ReplaySubject<boolean>(1);
    public hasToken = this.hasTokenSubject.asObservable();

    constructor (
        private apiService: ApiService,
    ) {}

    populate() {
        this.apiService.get(`/auth/`)
        .subscribe({
            next: (v) => this.setCsrfToken(v.token),
            error: (e) => this.purgeSession()
        });
      }

    populateGetCsrfToken(): Observable<string>{
        return this.apiService.get(`/auth/`)
        .pipe(map(data => {
            // Update the currentUser observable
            this.setCsrfToken(data.token);
            return data.token;
        }));
    }

    setCsrfToken(token:string){
        this.csrfTokenSubject.next(token);
        this.hasTokenSubject.next(true);
    }

    getCsrfToken():string {
        return this.csrfTokenSubject.value;
    }

    purgeSession() {
        this.csrfTokenSubject.next('');
        this.hasTokenSubject.next(false);
      }
}