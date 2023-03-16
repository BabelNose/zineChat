import { Component, OnInit } from '@angular/core';
import { User, UserService } from 'src/app/api-consumer';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  currentUser: User;

  constructor(
    private userService: UserService
  ) {
    this.currentUser = {
      id: '',
      email: '',
      username: ''
    }
  }

  ngOnInit() {
    this.userService.currentUser.subscribe(
      (userData) => {
        this.currentUser = userData;
      }
    );
  }

  logout() {
    this.userService.logout();
  }
}