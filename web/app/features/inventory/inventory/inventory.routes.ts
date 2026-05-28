import type { Routes } from '@angular/router';

export const INVENTORY_ROOT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () => import('./inventory.component').then((m) => m.InventoryComponent),
  },
];
