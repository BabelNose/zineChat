import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPostFormComponent } from './daily-post-form.component';

describe('DailyPostFormComponent', () => {
  let component: DailyPostFormComponent;
  let fixture: ComponentFixture<DailyPostFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyPostFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPostFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
