import type { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { NotFoundComponent } from './not-found.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SettingsComponent } from './pages/settings/settings.component';

export const USER_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Sign In - Inventory',
    component: LoginComponent,
  },
  {
    path: 'register',
    title: 'Create Account - Inventory',
    component: RegisterComponent,
  },
  {
    path: 'settings',
    title: 'Settings - Inventory',
    component: SettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    title: 'Not Found',
    component: NotFoundComponent,
  },
];

export const routes: Routes = [...USER_ROUTES];
