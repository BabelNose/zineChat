import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPostComponent } from './daily-post.component';

describe('DailyPostComponent', () => {
  let component: DailyPostComponent;
  let fixture: ComponentFixture<DailyPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyPostComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
