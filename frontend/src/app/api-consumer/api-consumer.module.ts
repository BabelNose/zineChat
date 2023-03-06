import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CredentialsInterceptor, CSRFInterceptor } from './interceptors';

import {
  ApiService,
  AuthGuard,
  JwtService,
  UserService,
  SessionService
} from './services';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: CSRFInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: CredentialsInterceptor, multi: true},
    ApiService,
    AuthGuard,
    JwtService,
    UserService,
    SessionService
  ],
  declarations: []
})
export class ApiConsumerModule { }