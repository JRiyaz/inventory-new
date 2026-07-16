import type { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers.component').then((m) => m.CustomersComponent),
    pathMatch: 'full',
  },
  {
    path: 'create',
    loadComponent: () => import('./customer-create/customer-create.component').then((m) => m.CustomerCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./customer-detail/customer-detail.component').then((m) => m.CustomerDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./customer-create/customer-create.component').then((m) => m.CustomerCreateComponent),
  },
];
