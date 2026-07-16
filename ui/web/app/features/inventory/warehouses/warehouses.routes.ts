import type { Routes } from '@angular/router';

export const WAREHOUSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./warehouses.component').then((m) => m.WarehousesComponent),
    pathMatch: 'full',
    data: { title: 'Warehouse Logistics' },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./warehouse-create/warehouse-create.component').then((m) => m.WarehouseCreateComponent),
    data: { title: 'Register New Facility' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./warehouse-detail/warehouse-detail.component').then((m) => m.WarehouseDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./warehouse-create/warehouse-create.component').then((m) => m.WarehouseCreateComponent),
    data: { title: 'Edit Warehouse' },
  },
];
