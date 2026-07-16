import type { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payments.component').then((m) => m.PaymentsComponent),
    pathMatch: 'full',
    data: { type: 'global' },
  },
  {
    path: 'sales',
    loadComponent: () => import('./payments.component').then((m) => m.PaymentsComponent),
    data: { type: 'sales' },
  },
  {
    path: 'procurement',
    loadComponent: () => import('./payments.component').then((m) => m.PaymentsComponent),
    data: { type: 'procurement' },
  },
  {
    path: ':id',
    loadComponent: () => import('./payment-detail/payment-detail.component').then((m) => m.PaymentDetailComponent),
  },
];
