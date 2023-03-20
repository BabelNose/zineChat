import { Component, Input } from '@angular/core';
import { User } from 'src/app/api-consumer';

@Component({
  selector: 'app-post-profile',
  templateUrl: './post-profile.component.html',
  styleUrls: ['./post-profile.component.sass']
})
export class PostProfileComponent {
  @Input() user: User = {
    id: '',
    email: '',
    username: ''
  };
}
