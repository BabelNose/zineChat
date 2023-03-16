import { Component, Input, OnInit } from '@angular/core';
import { DailyPostsService, Topic } from 'src/app/api-consumer';
import { TopicStatus } from 'src/app/api-consumer/enums/daily-post.status.enum';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.sass']
})
export class TopicComponent implements OnInit{
  private topic: Topic = {
    id:'',
    startDate: new Date(),
    status:TopicStatus.INACTIVE,
    text:''
  }
  @Input() topicId: string = '';

  constructor(private dailyPostService: DailyPostsService){}

  ngOnInit() {
    this.populateTopic(this.topicId);
  }

  populateTopic(topicId: string){
    this.dailyPostService.getTopic(topicId)
    .subscribe(topic => {
      console.log("mems topic", topic);
      this.topic = topic
    });
  }
}
