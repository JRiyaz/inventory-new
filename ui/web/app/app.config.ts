import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { httpInterceptorProviders, UserSettingsService } from 'ui-shared';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    ...httpInterceptorProviders,
    {
      provide: APP_INITIALIZER,
      useFactory: (userSettings: UserSettingsService) => () => userSettings.loadAndApplySettings(),
      deps: [UserSettingsService],
      multi: true,
    },
  ],
};
