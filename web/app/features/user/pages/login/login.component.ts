import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AuthStateService, environment, LoaderComponent, NotificationService, UserSettingsService } from 'ui-shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div
      class="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-900 dark:text-slate-200 flex items-center justify-center p-6 relative overflow-hidden"
    >
      <div class="w-full max-w-md relative z-10 animate-fade-in">
        <div class="flex flex-col items-center mb-7">
          <a routerLink="/" class="flex items-center gap-2 mb-6">
            <div
              class="w-11 h-11 bg-gradient-to-br from-primary to-blue-500 rounded-xl flex items-center justify-center rotate-3"
            >
              <span class="text-white font-black text-xl">I</span>
            </div>
          </a>
          <h1
            class="text-2xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            {{ is2faRequired() ? 'Two-Factor Verification' : 'Welcome Back' }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            {{ is2faRequired() ? 'Enter the security code from your authenticator app' : 'Sign in to your Inventory account' }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-md p-6 rounded-2xl shadow-xl dark:shadow-2xl"
        >
          @if (!is2faRequired()) {
            <form
              [formGroup]="loginForm"
              (ngSubmit)="onSubmit()"
              class="space-y-6"
            >
              <!-- Username Field -->
              <div class="floating-input-group">
                <input
                  type="text"
                  formControlName="username"
                  id="login-username"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="login-username" class="floating-label"
                  >Username</label
                >
                <!-- Validation Error -->
                @if (usernameInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    @if (loginForm.get('username')?.errors?.['required']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >Username is required</span
                      >
                    }
                    @if (loginForm.get('username')?.errors?.['minlength']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >Min 3 characters required</span
                      >
                    }
                    @if (loginForm.get('username')?.errors?.['backendError']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >{{ loginForm.get('username')?.errors?.['backendError'] }}</span
                      >
                    }
                  </div>
                }
              </div>

              <!-- Password Field -->
              <div class="floating-input-group">
                <input
                  type="password"
                  formControlName="password"
                  id="login-password"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="login-password" class="floating-label"
                  >Password</label
                >
                <!-- Validation Error -->
                @if (passwordInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    @if (loginForm.get('password')?.errors?.['required']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >Password is required</span
                      >
                    }
                    @if (loginForm.get('password')?.errors?.['minlength']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >Min 6 characters required</span
                      >
                    }
                    @if (loginForm.get('password')?.errors?.['backendError']) {
                      <span
                        class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                        >{{ loginForm.get('password')?.errors?.['backendError'] }}</span
                      >
                    }
                  </div>
                }
                <a
                  routerLink="/user/forgot-password"
                  class="absolute right-0 top-7 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest z-10"
                  >Forgot?</a
                >
              </div>

              <button
                type="submit"
                [disabled]="isFormInvalid() || isLoading()"
                class="w-full btn-primary-premium !py-3"
                id="login-submit"
              >
                <lib-loader [loading]="isLoading()" label="Sign In"></lib-loader>
              </button>
            </form>

            <div class="relative my-7">
              <div class="absolute inset-0 flex items-center">
                <div
                  class="w-full border-t border-slate-200 dark:border-white/[0.08]"
                ></div>
              </div>
              <div
                class="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"
              >
                <span
                  class="bg-white dark:bg-dark-base px-4 text-slate-500 dark:text-slate-400"
                  >Or continue with</span
                >
              </div>
            </div>

            <!-- Social Logins Grid -->
            <div class="grid grid-cols-3 gap-2">
              <!-- Google -->
              <button
                type="button"
                (click)="loginWithOAuth('google')"
                class="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all text-slate-900 dark:text-white"
              >
                <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.896 4.136-1.248 1.248-3.224 2.536-7.224 2.536-5.88 0-10.456-4.76-10.456-10.64s4.576-10.64 10.456-10.64c3.24 0 5.64 1.264 7.424 2.976l2.328-2.328c-1.92-1.84-4.824-3.232-8.992-3.232-7.536 0-13.728 6.12-13.728 13.64s6.192 13.64 13.728 13.64c4.104 0 7.424-1.328 9.824-3.832 2.52-2.52 3.312-6.048 3.312-8.736 0-.84-.048-1.544-.144-2.24h-12.984z" />
                </svg>
                <span class="text-[9px] font-bold uppercase tracking-tight">Google</span>
              </button>

              <!-- Facebook -->
              <button
                type="button"
                (click)="loginWithOAuth('facebook')"
                class="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all text-slate-900 dark:text-white"
              >
                <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
                <span class="text-[9px] font-bold uppercase tracking-tight">Facebook</span>
              </button>

              <!-- Apple -->
              <button
                type="button"
                (click)="loginWithOAuth('apple')"
                class="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all text-slate-900 dark:text-white"
              >
                <svg class="w-5 h-5 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.88.08 2.15-.52 2.81-1.33z" />
                </svg>
                <span class="text-[9px] font-bold uppercase tracking-tight">Apple</span>
              </button>
            </div>
          } @else {
            <!-- 2FA Form View -->
            <form
              [formGroup]="twoFactorForm"
              (ngSubmit)="on2FaSubmit()"
              class="space-y-6 animate-fade-in"
            >
              <div class="floating-input-group">
                <input
                  type="text"
                  formControlName="code"
                  id="login-2fa-code"
                  placeholder=" "
                  class="floating-input font-mono tracking-widest text-center"
                  maxLength="6"
                />
                <label for="login-2fa-code" class="floating-label">6-Digit TOTP Code</label>
                <!-- Validation Error -->
                @if (twoFactorInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    @if (twoFactorForm.get('code')?.errors?.['required']) {
                      <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Code is required</span>
                    }
                    @if (twoFactorForm.get('code')?.errors?.['minlength'] || twoFactorForm.get('code')?.errors?.['pattern']) {
                      <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Must be a 6-digit number</span>
                    }
                    @if (twoFactorForm.get('code')?.errors?.['backendError']) {
                      <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">
                        {{ twoFactorForm.get('code')?.errors?.['backendError'] }}
                      </span>
                    }
                  </div>
                }
              </div>

              <button
                type="submit"
                [disabled]="twoFactorForm.invalid || isLoading()"
                class="w-full btn-primary-premium !py-3"
              >
                <lib-loader [loading]="isLoading()" label="Verify & Login"></lib-loader>
              </button>

              <button
                type="button"
                (click)="cancel2Fa()"
                class="w-full py-2 bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-all mt-2"
              >
                Cancel & Back
              </button>
            </form>
          }
        </div>

        @if (!is2faRequired()) {
          <p class="text-center text-slate-500 dark:text-slate-400 text-xs mt-8">
            New here?
            <a
              routerLink="/user/register"
              class="text-primary font-bold uppercase tracking-widest hover:underline ml-1"
              >Create Account</a
            >
          </p>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthStateService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private userSettingsService = inject(UserSettingsService);

  isLoading = signal(false);
  is2faRequired = signal(false);
  targetUsername = signal('');

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  twoFactorForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]+$/)]],
  });

  // Signal for form validity
  private formStatus = toSignal(
    this.loginForm.statusChanges.pipe(
      startWith(this.loginForm.status),
      map((status) => status === 'INVALID'),
    ),
    { initialValue: true },
  );

  isFormInvalid = computed(() => this.formStatus());

  // Signals for field validity
  usernameInvalid = toSignal(
    this.loginForm.get('username')!.statusChanges.pipe(
      startWith(this.loginForm.get('username')?.status),
      map(() => this.loginForm.get('username')?.touched && this.loginForm.get('username')?.invalid),
    ),
    { initialValue: false },
  );

  passwordInvalid = toSignal(
    this.loginForm.get('password')!.statusChanges.pipe(
      startWith(this.loginForm.get('password')?.status),
      map(() => this.loginForm.get('password')?.touched && this.loginForm.get('password')?.invalid),
    ),
    { initialValue: false },
  );

  twoFactorInvalid = toSignal(
    this.twoFactorForm.get('code')!.statusChanges.pipe(
      startWith(this.twoFactorForm.get('code')?.status),
      map(() => this.twoFactorForm.get('code')?.touched && this.twoFactorForm.get('code')?.invalid),
    ),
    { initialValue: false },
  );

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);

      const payload = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
      };

      this.http.post<any>(`${environment.apiUrl}/auth/login`, payload, { withCredentials: true }).subscribe({
        next: async (res) => {
          if (res && res.status === 'requires_2fa') {
            this.is2faRequired.set(true);
            this.targetUsername.set(res.username);
            this.isLoading.set(false);
            this.notificationService.info('MFA Verification Required', 'Please enter your 2FA security code.');
            return;
          }

          await this.completeSession();
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 422 && err.error?.detail) {
            this.handlePydanticErrors(this.loginForm, err.error.detail);
          } else {
            const errorMsg = err.error?.detail || 'Incorrect username or credentials supplied.';
            this.notificationService.error('Sign In Failed', errorMsg);
          }
        },
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  on2FaSubmit() {
    if (this.twoFactorForm.valid) {
      this.isLoading.set(true);

      const payload = {
        username: this.targetUsername(),
        code: this.twoFactorForm.value.code,
      };

      this.http.post<any>(`${environment.apiUrl}/auth/login/2fa`, payload, { withCredentials: true }).subscribe({
        next: async (_res) => {
          await this.completeSession();
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 422 && err.error?.detail) {
            this.handlePydanticErrors(this.twoFactorForm, err.error.detail);
          } else {
            const errorMsg = err.error?.detail || 'Invalid verification code. Please try again.';
            this.notificationService.error('MFA Failed', errorMsg);
          }
        },
      });
    } else {
      this.twoFactorForm.markAllAsTouched();
    }
  }

  cancel2Fa() {
    this.is2faRequired.set(false);
    this.targetUsername.set('');
    this.twoFactorForm.reset();
  }

  loginWithOAuth(provider: string) {
    window.location.href = `${environment.apiUrl}/auth/oauth/${provider}`;
  }

  private async completeSession() {
    try {
      // Fetch real backend user profile
      const profile = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/user/me`, { withCredentials: true }),
      );

      if (profile) {
        // Log in reactively
        this.auth.login({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          username: profile.username,
          roles: [profile.role],
          avatarUrl: profile.avatar_url || '',
        });

        // Load preferences (theme, notification config, display image status)
        await this.userSettingsService.loadAndApplySettings();

        this.notificationService.success('Welcome back', `Logged in successfully as ${profile.name}`);

        // Redirect to main inventory hub dashboard MFE
        this.router.navigate(['/inventory']);
      }
    } catch (_e) {
      this.notificationService.error('Profile Error', 'Failed to retrieve user profile after login.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private handlePydanticErrors(form: FormGroup, details: any[]) {
    for (const error of details) {
      // Pydantic returns path in loc array, e.g. ["body", "username"]
      const fieldName = error.loc[error.loc.length - 1];
      // Convert snake_case (Pydantic payload) to camelCase (Form controls)
      const camelField = fieldName.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
      const control = form.get(camelField) || form.get(fieldName);

      if (control) {
        control.setErrors({ backendError: error.msg });
        control.markAsTouched();
      }
    }
  }
}
