import {
    Directive,
    Input,
    OnInit,
    TemplateRef,
    ViewContainerRef
  } from '@angular/core';
  
  import { UserService } from '../api-consumer';
  
  @Directive({ selector: '[appShowAuthed]' })
  export class ShowAuthedDirective implements OnInit {
    condition: boolean = false;

    constructor(
      private templateRef: TemplateRef<any>,
      private userService: UserService,
      private viewContainer: ViewContainerRef
    ) {}
  
  
    ngOnInit() {
      this.userService.isAuthenticated.subscribe(
        (isAuthenticated) => {
          if (isAuthenticated && this.condition || !isAuthenticated && !this.condition) {
            this.viewContainer.createEmbeddedView(this.templateRef);
          } else {
            this.viewContainer.clear();
          }
        }
      );
    }
  
    @Input() set appShowAuthed(condition: boolean) {
      this.condition = condition;
    }
  
  }