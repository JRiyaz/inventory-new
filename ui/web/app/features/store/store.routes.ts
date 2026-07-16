import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/store-layout.component').then((m) => m.StoreLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./store-home.component').then((m) => m.StoreHomeComponent),
        pathMatch: 'full',
      },
      {
        path: 'offers',
        loadComponent: () => import('./product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'search',
        loadComponent: () => import('./search-results.component').then((m) => m.SearchResultsComponent),
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./product-detail.component').then((m) => m.ProductDetailComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./wishlist.component').then((m) => m.WishlistComponent),
      },
    ],
  },
];

export default STORE_ROUTES;
