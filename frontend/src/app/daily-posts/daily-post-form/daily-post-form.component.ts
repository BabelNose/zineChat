import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { DailyPostsService, Errors } from 'src/app/api-consumer';

@Component({
  selector: 'app-reactive-daily-post-form',
  templateUrl: './daily-post-form.component.html'
})
export class DailyPostFormComponent {
  @Input() topicId: string = '';
  dailyPostForm: FormGroup;
  errors: Errors = {message:''};
  isSubmitting = false;

  constructor(
    private dailyPostService: DailyPostsService,
    private fb: FormBuilder
  ) {
    // use FormBuilder to create a form group
    this.dailyPostForm = this.fb.group({
      'title': ['', Validators.required],
      'text': ['', Validators.required]
    });
  }
  
  submitForm() {
    this.isSubmitting = true;
    this.errors = {message: ''};

    const formData = this.dailyPostForm.value;
      this.dailyPostService
      .add({...formData, topicId:this.topicId})
      .subscribe({
        next: (v) => console.log("RESPONSE", v),
        error: (e) => {
          this.errors = e;
          this.isSubmitting = false;
        }
      });
  }
}