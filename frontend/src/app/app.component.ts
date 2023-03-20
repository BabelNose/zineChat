import { Component, OnInit } from "@angular/core";

import { SessionService, UserService } from "./api-consumer";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  constructor(
    private userService: UserService,
    private sessionService: SessionService) {}

  ngOnInit() {
    this.userService.populate();
    this.sessionService.populate();
  }
}