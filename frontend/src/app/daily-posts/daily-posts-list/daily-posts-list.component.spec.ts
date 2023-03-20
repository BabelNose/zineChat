import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyPostsListComponent } from './daily-posts-list.component';

describe('DailyPostsListComponent', () => {
  let component: DailyPostsListComponent;
  let fixture: ComponentFixture<DailyPostsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyPostsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyPostsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
