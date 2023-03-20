import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { map, tap } from 'rxjs/operators';
import { CreateDailyPost, DailyPost, Topic } from '../models/daily-post.model';

@Injectable()
export class DailyPostsService {
    constructor (
        private apiService: ApiService
    ) {}

  private refreshRequired = new Subject<void>();

  get RefreshRequired(){
    return this.refreshRequired;
  }

  add(payload:CreateDailyPost): Observable<DailyPost> {
    return this.apiService.post(`/daily-posts/`,payload)
      .pipe(map(data => data)).pipe(tap(() => {
        this.RefreshRequired.next();
      }));
  }

  get(postSlug:string):Observable<DailyPost> {
    return this.apiService.get(`/daily-posts/${postSlug}`)
        .pipe(map(data => data));
  }

  getAll(topicSlug:string): Observable<DailyPost[]> {
    return this.apiService.get(`/daily-posts/topic/${topicSlug}`)
        .pipe(map(data => data));
  }

  getTopic(topicSlug:string): Observable<Topic> {
    return this.apiService.get(`/topics/${topicSlug}`)
        .pipe(map(data => data));
  }
}