import type { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./products.component').then((m) => m.ProductsComponent),
    pathMatch: 'full',
    data: { title: 'Products Management' },
  },
  {
    path: 'create',
    loadComponent: () => import('./product-create/product-create.component').then((m) => m.ProductCreateComponent),
    data: { title: 'New Product Entry' },
  },
  {
    path: ':id',
    loadComponent: () => import('./product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
    data: { title: 'Product Details' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./product-create/product-create.component').then((m) => m.ProductCreateComponent),
    data: { title: 'Edit Product' },
  },
];
