import { HttpClient } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environment';

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  username?: string;
  roles: string[];
  avatarUrl: string;
  twoFactorEnabled?: boolean;
}

export interface UserPermissions {
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
}

/** Default permissions: admins get full access, others get read-only */
const ADMIN_PERMISSIONS: UserPermissions = {
  can_read: true,
  can_write: true,
  can_update: true,
  can_delete: true,
};

const DEFAULT_PERMISSIONS: UserPermissions = {
  can_read: true,
  can_write: false,
  can_update: false,
  can_delete: false,
};

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly _isLoggedIn = signal(false);
  private readonly _availableRoles = signal<string[]>(['Admin', 'Agent', 'Customer']);
  private readonly _user = signal<UserProfile | null>(null);

  /** RBAC permission flags loaded from backend (or defaults) */
  private readonly _permissions = signal<UserPermissions>(ADMIN_PERMISSIONS);

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly user = this._user.asReadonly();
  readonly availableRoles = this._availableRoles.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  /** Current roles assigned to the user */
  readonly userRoles = computed(() => this._user()?.roles || []);

  /** True if user has Admin role among their active roles */
  readonly isAdmin = computed(() => (this._user()?.roles || []).includes('Admin'));

  /** Roles available in the system that user doesn't have yet */
  readonly otherRoles = computed(() => {
    const active = this.userRoles();
    return this._availableRoles().filter((r) => !active.includes(r));
  });

  addSystemRole(role: string): void {
    if (role && !this._availableRoles().includes(role)) {
      this._availableRoles.update((r) => [...r, role]);
    }
  }

  deleteSystemRole(role: string): void {
    this._availableRoles.update((r) => r.filter((x) => x !== role));
    // Also remove from user if they had it
    this.removeRoleFromUser(role);
  }

  toggleRole(role: string): void {
    const user = this._user();
    if (!user) return;

    if (user.roles.includes(role)) {
      this.removeRoleFromUser(role);
    } else {
      this.assignRoleToUser(role);
    }
  }

  assignRoleToUser(role: string): void {
    this._user.update((u) => (u ? { ...u, roles: [...new Set([...u.roles, role])] } : null));
  }

  removeRoleFromUser(role: string): void {
    this._user.update((u) => (u ? { ...u, roles: u.roles.filter((r) => r !== role) } : null));
  }

  hasRole(role: string): boolean {
    return (this._user()?.roles || []).includes(role);
  }

  /** Update RBAC permission flags (called after backend load) */
  updatePermissions(perms: UserPermissions): void {
    this._permissions.set(perms);
  }

  /** Set user profile (used after real login response) */
  setUser(user: UserProfile): void {
    this._user.set(user);
    // Admins get full permissions by default until backend load
    if (user.roles.includes('Admin')) {
      this._permissions.set(ADMIN_PERMISSIONS);
    } else {
      this._permissions.set(DEFAULT_PERMISSIONS);
    }
  }

  /** Set the full list of available system roles */
  setAvailableRoles(roles: string[]): void {
    this._availableRoles.set(roles);
  }
  readonly userInitials = computed(() => {
    const u = this._user();
    if (!u) return '?';
    return u.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });
  readonly avatarUrl = computed(() => {
    const u = this._user();
    if (!u) return '';
    return u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b429f&color=fff`;
  });

  /** Simulate login — replace with real auth later */
  login(user: UserProfile): void {
    this._user.set(user);
    this._isLoggedIn.set(true);
  }

  logout(): void {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this._user.set(null);
        this._isLoggedIn.set(false);
        this.router.navigate(['/user/login']);
      },
      error: (err) => {
        console.error('Failed to log out from backend', err);
        // Fallback: still log out locally so user isn't stuck
        this._user.set(null);
        this._isLoggedIn.set(false);
        this.router.navigate(['/user/login']);
      },
    });
  }

  /** Toggle login for demo purposes */
  toggleAuth(): void {
    if (this._isLoggedIn()) {
      this.logout();
    } else {
      this.login({
        name: 'Riyaz Khan',
        email: 'riyaz@company.com',
        roles: ['Admin'],
        avatarUrl: '',
      });
    }
  }
}
