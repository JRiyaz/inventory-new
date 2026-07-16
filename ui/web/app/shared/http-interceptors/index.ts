import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthCsrfInterceptor } from './auth-csrf.interceptor';
import { LoggingService } from './logging-service';

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: LoggingService, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthCsrfInterceptor, multi: true },
];
