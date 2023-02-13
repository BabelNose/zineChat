import { Component, Input } from '@angular/core';

import { Errors } from '../api-consumer';

@Component({
  selector: 'app-list-errors',
  templateUrl: './list-errors.component.html'
})
export class ListErrorsComponent {
  formattedErrors: Array<string> = [];

  @Input()
  set errors(errorList: Errors) { 
    if(errorList.message !== ''){
      this.formattedErrors.push(errorList.message);
    }
  }

  get errorList() { return this.formattedErrors; }
}