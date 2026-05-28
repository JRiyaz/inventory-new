import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { DisplayImageService } from './display-image.service';
import { NotificationService } from './notification.service';
import { ThemeService } from './theme.service';

export interface BackendUserSettings {
  theme: string;
  loader_animation: string;
  animation_tempo: number;
  display_images: boolean;
  dnd: boolean;
  urgent_persistence: boolean;
  notification_duration: number;
  notification_placement: string;
}

export interface RolePermission {
  role: string;
  can_read: boolean;
  can_write: boolean;
  can_update: boolean;
  can_delete: boolean;
}

const API_BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private http = inject(HttpClient);
  private auth = inject(AuthStateService);
  private themeService = inject(ThemeService);
  private displayImageService = inject(DisplayImageService);
  private notificationService = inject(NotificationService);

  /** True while syncing settings to backend */
  readonly isSaving = signal(false);
  /** True while loading settings from backend */
  readonly isLoading = signal(false);
  /** True if any in-memory settings haven't been saved to DB yet */
  readonly isDirty = signal(false);
  /** All role permissions loaded from backend */
  readonly allRolePermissions = signal<RolePermission[]>([]);
  /** True if saving permissions */
  readonly isSavingPermissions = signal(false);

  /**
   * Fetch user settings from the backend and apply to all UI services.
   * Called on dashboard bootstrap.
   */
  async loadAndApplySettings(): Promise<void> {
    this.isLoading.set(true);
    try {
      // 1. Verify active session from cookie
      const profile = await firstValueFrom(
        this.http.get<any>(`${API_BASE}/user/me`, { withCredentials: true }).pipe(catchError(() => of(null))),
      );

      if (profile) {
        // Log in the user in our AuthState reactively
        this.auth.login({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          username: profile.username,
          roles: [profile.role],
          avatarUrl: profile.avatar_url || '',
        });

        // 2. Load and apply settings
        const settings = await firstValueFrom(
          this.http
            .get<BackendUserSettings>(`${API_BASE}/user/settings`, { withCredentials: true })
            .pipe(catchError(() => of(null))),
        );

        if (settings) {
          // Apply theme
          this.themeService.setTheme(settings.theme as any);
          // Apply loader
          this.themeService.setLoader(settings.loader_animation as any);
          // Apply animation tempo
          this.themeService.setLoaderDuration(settings.animation_tempo);
          // Apply display images
          this.displayImageService.setDisplayImage(settings.display_images);
          // Apply notification config
          this.notificationService.updateConfig({
            dnd: settings.dnd,
            urgentStick: settings.urgent_persistence,
            duration: settings.notification_duration,
            placement: settings.notification_placement as any,
          });
        }

        // 3. Load permissions for current user's role
        await this.loadPermissionsForCurrentUser();
      } else {
        // Not authenticated, trigger logout cleanup
        this.auth.logout();
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load the RBAC permission flags for the current user's primary role
   * and apply them to the AuthStateService.
   */
  async loadPermissionsForCurrentUser(): Promise<void> {
    const roles = this.auth.userRoles();
    if (!roles.length) return;

    try {
      const allPerms = await firstValueFrom(
        this.http
          .get<RolePermission[]>(`${API_BASE}/user/permissions`, { withCredentials: true })
          .pipe(catchError(() => of(null))),
      );

      if (allPerms) {
        this.allRolePermissions.set(allPerms);
        // Use the first (primary) role for permission resolution
        const primaryRole = roles[0];
        const myPerm = allPerms.find((p) => p.role === primaryRole);
        if (myPerm) {
          this.auth.updatePermissions({
            can_read: myPerm.can_read,
            can_write: myPerm.can_write,
            can_update: myPerm.can_update,
            can_delete: myPerm.can_delete,
          });
        }
      }
    } catch {
      // Silently fail — permissions remain at local defaults
    }
  }

  /**
   * Collect current UI service state into a BackendUserSettings payload.
   */
  buildCurrentSettingsPayload(): BackendUserSettings {
    return {
      theme: this.themeService.currentTheme(),
      loader_animation: this.themeService.currentLoader(),
      animation_tempo: this.themeService.loaderDuration(),
      display_images: this.displayImageService.displayImage(),
      dnd: this.notificationService.config().dnd,
      urgent_persistence: this.notificationService.config().urgentStick,
      notification_duration: this.notificationService.config().duration,
      notification_placement: this.notificationService.config().placement,
    };
  }

  /**
   * Mark settings as dirty (in-memory changed but not yet saved).
   */
  markDirty(): void {
    this.isDirty.set(true);
  }

  /**
   * Persist current in-memory settings to the backend database.
   */
  async saveSettings(): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const payload = this.buildCurrentSettingsPayload();
      await firstValueFrom(
        this.http.put<BackendUserSettings>(`${API_BASE}/user/settings`, payload, { withCredentials: true }),
      );
      this.isDirty.set(false);
      return true;
    } catch {
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Update permissions for a specific role on the backend.
   */
  async saveRolePermissions(role: string, perms: Omit<RolePermission, 'role'>): Promise<boolean> {
    this.isSavingPermissions.set(true);
    try {
      await firstValueFrom(this.http.put(`${API_BASE}/user/permissions/${role}`, perms, { withCredentials: true }));
      // Refresh local permissions list
      await this.loadPermissionsForCurrentUser();
      return true;
    } catch {
      return false;
    } finally {
      this.isSavingPermissions.set(false);
    }
  }
}
