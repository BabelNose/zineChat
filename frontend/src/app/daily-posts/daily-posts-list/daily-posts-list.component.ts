import { Component, Input, OnInit } from '@angular/core';
import { DailyPost } from 'src/app/api-consumer/models';
import { DailyPostsService } from 'src/app/api-consumer/services';

@Component({
  selector: 'app-daily-posts-list',
  templateUrl: './daily-posts-list.component.html',
  styleUrls: ['./daily-posts-list.component.sass']
})
export class DailyPostsListComponent implements OnInit {
  posts: DailyPost[] = [];
  @Input() topicId: string = '';
  
  constructor(
    private dailyPostService: DailyPostsService
  ){}

  ngOnInit() {
    this.populateDailyPosts(this.topicId);
  }

  populateDailyPosts(topicId: string){
    this.dailyPostService.getAll(topicId)
    .subscribe(posts => {
      console.log("mems posts", posts);
      this.posts = posts
    });
  }
}
