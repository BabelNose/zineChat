import { Component, Input } from '@angular/core';
import { DailyPost } from 'src/app/api-consumer';

@Component({
  selector: 'app-daily-post',
  templateUrl: './daily-post.component.html',
  styleUrls: ['./daily-post.component.sass']
})
export class DailyPostComponent {
  @Input() post: DailyPost = {
    id:'',
    title: '',
    text: '',
    timestamp: new Date(),
    topicId:'',
    userId:{id:'', email:'', username:''}
  };
}
