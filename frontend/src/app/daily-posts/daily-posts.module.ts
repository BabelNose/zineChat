import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyPostComponent } from './daily-post/daily-post.component';
import { DailyPostsListComponent } from './daily-posts-list/daily-posts-list.component';
import { PostProfileComponent } from './post-profile/post-profile.component';
import { DailyPostsService } from '../api-consumer';
import { TopicComponent } from './topic/topic.component';
import { DailyPostFormComponent } from './daily-post-form/daily-post-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared';




@NgModule({
  providers: [
    DailyPostsService
  ],
  declarations: [
    DailyPostComponent,
    DailyPostsListComponent,
    DailyPostFormComponent,
    PostProfileComponent,
    TopicComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule
  ],
  exports: [
    DailyPostComponent,
    DailyPostsListComponent,
    PostProfileComponent,
    TopicComponent
  ]
})
export class DailyPostsModule { }
  