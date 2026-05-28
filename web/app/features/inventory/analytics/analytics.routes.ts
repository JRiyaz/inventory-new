import type { Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics.component';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    component: AnalyticsComponent,
    pathMatch: 'full',
    data: { type: 'global' },
  },
  {
    path: 'sales',
    component: AnalyticsComponent,
    data: { type: 'sales' },
  },
  {
    path: 'procurement',
    component: AnalyticsComponent,
    data: { type: 'procurement' },
  },
];
