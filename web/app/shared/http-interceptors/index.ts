import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoggingService } from './logging-service';

export const httpInterceptorProviders = [{ provide: HTTP_INTERCEPTORS, useClass: LoggingService, multi: true }];
