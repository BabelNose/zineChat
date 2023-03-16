import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app.routing.module';
import { AppComponent } from './app.component';
import { ApiConsumerModule } from './api-consumer';
import { AuthModule } from './auth/auth.module';
import { SharedModule, HeaderComponent } from './shared';
import { DailyPostsModule } from './daily-posts/daily-posts.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ApiConsumerModule,
    HttpClientModule,
    AuthModule,
    SharedModule,
    DailyPostsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
