import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Functional guard: requires the user to be logged in.
 * Redirects to /user/login if the session is not active.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/user/login']);
};

/**
 * Functional guard: requires the user to have the Admin role.
 * Redirects to /user/settings with a permission error query param.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/user/settings'], { queryParams: { error: 'insufficient_permissions' } });
};

/**
 * Functional guard factory: requires a specific permission flag.
 * Usage: canActivate: [permissionGuard('can_write')]
 */
export const permissionGuard = (permission: 'can_read' | 'can_write' | 'can_update' | 'can_delete'): CanActivateFn => {
  return () => {
    const auth = inject(AuthStateService);
    const router = inject(Router);

    const perms = auth.permissions();
    if (perms[permission]) {
      return true;
    }
    return router.createUrlTree(['/user/settings'], { queryParams: { error: 'insufficient_permissions' } });
  };
};
