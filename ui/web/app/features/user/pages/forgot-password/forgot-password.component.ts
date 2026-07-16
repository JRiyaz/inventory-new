import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { map, startWith } from 'rxjs/operators';
import { environment, LoaderComponent, NotificationService } from 'ui-shared';

@Component({
  selector: 'app-forgot-password',
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
            Reset Your Password
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            {{ isCodeSent() ? 'Enter the verification OTP and your new password' : 'We will send a 6-digit OTP code to verify your email' }}
          </p>
        </div>

        <div
          class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-md p-6 rounded-2xl shadow-xl dark:shadow-2xl"
        >
          <!-- Step 1: Request OTP -->
          @if (!isCodeSent()) {
            <form
              [formGroup]="requestForm"
              (ngSubmit)="onSendOtp()"
              class="space-y-6"
            >
              <div class="floating-input-group">
                <input
                  type="email"
                  formControlName="email"
                  id="forgot-email"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="forgot-email" class="floating-label">Email Address</label>
                @if (emailInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">
                      {{ requestForm.get('email')?.errors?.['backendError'] || 'Valid email is required' }}
                    </span>
                  </div>
                }
              </div>

              <button
                type="submit"
                [disabled]="requestForm.invalid || isLoading()"
                class="w-full btn-primary-premium !py-3"
              >
                <lib-loader [loading]="isLoading()" label="Send Verification Code"></lib-loader>
              </button>
            </form>
          } @else {
            <!-- Step 2: Confirm OTP & Reset Password -->
            <form
              [formGroup]="resetForm"
              (ngSubmit)="onResetPassword()"
              class="space-y-6"
            >
              <!-- Verification Code -->
              <div class="floating-input-group">
                <input
                  type="text"
                  formControlName="otp"
                  id="forgot-otp"
                  placeholder=" "
                  class="floating-input font-mono tracking-widest text-center"
                  maxLength="6"
                />
                <label for="forgot-otp" class="floating-label">6-Digit OTP Code</label>
                @if (otpInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">
                      {{ resetForm.get('otp')?.errors?.['backendError'] || '6-digit OTP code is required' }}
                    </span>
                  </div>
                }
              </div>

              <!-- New Password -->
              <div class="floating-input-group">
                <input
                  type="password"
                  formControlName="newPassword"
                  id="forgot-new-pwd"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="forgot-new-pwd" class="floating-label">New Password</label>
                @if (newPasswordInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">
                      {{ resetForm.get('newPassword')?.errors?.['backendError'] || 'Min 8 characters required' }}
                    </span>
                  </div>
                }
              </div>

              <!-- Confirm Password -->
              <div class="floating-input-group">
                <input
                  type="password"
                  formControlName="confirmPassword"
                  id="forgot-confirm-pwd"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="forgot-confirm-pwd" class="floating-label">Confirm Password</label>
                @if (confirmPasswordInvalid()) {
                  <div class="absolute -bottom-5 left-0">
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">
                      {{ resetForm.errors?.['mismatch'] ? 'Passwords do not match' : 'Required field' }}
                    </span>
                  </div>
                }
              </div>

              <button
                type="submit"
                [disabled]="resetForm.invalid || isLoading()"
                class="w-full btn-primary-premium !py-3"
              >
                <lib-loader [loading]="isLoading()" label="Verify & Reset Password"></lib-loader>
              </button>
            </form>
          }
        </div>

        <p class="text-center text-slate-500 dark:text-slate-400 text-xs mt-8">
          Remember credentials?
          <a
            routerLink="/user/login"
            class="text-primary font-bold uppercase tracking-widest hover:underline ml-1"
            >Sign In</a
          >
        </p>
      </div>
    </div>
  `,
  styles: [],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);
  isCodeSent = signal(false);
  targetEmail = signal('');

  requestForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm: FormGroup = this.fb.group(
    {
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  // Verification Signals for Step 1
  emailInvalid = toSignal(
    this.requestForm.get('email')!.statusChanges.pipe(
      startWith(this.requestForm.get('email')?.status),
      map(() => this.requestForm.get('email')?.touched && this.requestForm.get('email')?.invalid),
    ),
    { initialValue: false },
  );

  // Verification Signals for Step 2
  otpInvalid = toSignal(
    this.resetForm.get('otp')!.statusChanges.pipe(
      startWith(this.resetForm.get('otp')?.status),
      map(() => this.resetForm.get('otp')?.touched && this.resetForm.get('otp')?.invalid),
    ),
    { initialValue: false },
  );

  newPasswordInvalid = toSignal(
    this.resetForm.get('newPassword')!.statusChanges.pipe(
      startWith(this.resetForm.get('newPassword')?.status),
      map(() => this.resetForm.get('newPassword')?.touched && this.resetForm.get('newPassword')?.invalid),
    ),
    { initialValue: false },
  );

  confirmPasswordInvalid = toSignal(
    this.resetForm.statusChanges.pipe(
      startWith(this.resetForm.status),
      map(
        () =>
          this.resetForm.get('confirmPassword')?.touched &&
          (this.resetForm.get('confirmPassword')?.invalid || this.resetForm.errors?.['mismatch']),
      ),
    ),
    { initialValue: false },
  );

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  onSendOtp() {
    if (this.requestForm.valid) {
      this.isLoading.set(true);
      const email = this.requestForm.value.email;
      this.http.post<any>(`${environment.apiUrl}/auth/forgot-password/request`, { email }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.targetEmail.set(email);
          this.isCodeSent.set(true);
          this.notificationService.success('OTP Dispatched', res.message || 'OTP verification code sent.');
        },
        error: (err) => {
          this.isLoading.set(false);
          // Highlight dynamic field error if present
          if (err.status === 422 && err.error?.detail) {
            this.handlePydanticErrors(this.requestForm, err.error.detail);
          } else {
            this.notificationService.error('Request Failed', err.error?.detail || 'Failed to dispatch reset code.');
          }
        },
      });
    }
  }

  onResetPassword() {
    if (this.resetForm.valid) {
      this.isLoading.set(true);
      const payload = {
        email: this.targetEmail(),
        otp: this.resetForm.value.otp,
        new_password: this.resetForm.value.newPassword,
      };

      this.http.post<any>(`${environment.apiUrl}/auth/forgot-password/reset`, payload).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.notificationService.success('Password Reset', res.message || 'Password successfully updated.');
          this.router.navigate(['/user/login']);
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 422 && err.error?.detail) {
            this.handlePydanticErrors(this.resetForm, err.error.detail);
          } else {
            this.notificationService.error('Reset Failed', err.error?.detail || 'Failed to reset credentials.');
          }
        },
      });
    }
  }

  private handlePydanticErrors(form: FormGroup, details: any[]) {
    for (const error of details) {
      // Pydantic returns path in loc array, e.g. ["body", "email"] or ["body", "new_password"]
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
