import type { Routes } from '@angular/router';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./suppliers.component').then((m) => m.SuppliersComponent),
    pathMatch: 'full',
    data: { title: 'Supplier Network' },
  },
  {
    path: 'create',
    loadComponent: () => import('./supplier-create/supplier-create.component').then((m) => m.SupplierCreateComponent),
    data: { title: 'New Vendor Onboarding' },
  },
  {
    path: ':id',
    loadComponent: () => import('./supplier-detail/supplier-detail.component').then((m) => m.SupplierDetailComponent),
    data: { title: 'Supplier Profile' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./supplier-create/supplier-create.component').then((m) => m.SupplierCreateComponent),
    data: { title: 'Edit Supplier' },
  },
];
