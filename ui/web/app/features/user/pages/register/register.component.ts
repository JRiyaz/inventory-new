import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { map, startWith } from 'rxjs/operators';
import {
  AuthStateService,
  environment,
  LoaderComponent,
  NotificationService,
  UsernameValidatorDirective,
} from 'ui-shared';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LoaderComponent, UsernameValidatorDirective],
  template: `
    <div
      class="min-h-screen bg-slate-50 dark:bg-dark-base text-slate-900 dark:text-slate-200 flex items-center justify-center p-6 relative overflow-hidden"
    >
      <div class="w-full max-w-xl relative z-10">
        <div class="flex flex-col items-center mb-10">
          <a routerLink="/" class="flex items-center gap-2 mb-6">
            <div
              class="w-14 h-14 bg-gradient-to-br from-primary to-blue-500 rounded-2xl flex items-center justify-center -rotate-3"
            >
              <span class="text-white font-black text-2xl">I</span>
            </div>
          </a>
          <h1
            class="text-3xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Create Account
          </h1>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Start managing your inventory today
          </p>
        </div>

        <div class="card-premium p-8 sm:p-10 !rounded-3xl shadow-xl">
          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8"
          >
            <!-- First Name -->
            <div class="floating-input-group">
              <input
                type="text"
                formControlName="firstName"
                id="register-firstname"
                placeholder=" "
                class="floating-input"
              />
              <label for="register-firstname" class="floating-label"
                >First Name</label
              >
              @if (firstNameInvalid()) {
                <div class="absolute -bottom-5 left-0">
                  @if (registerForm.get('firstName')?.errors?.['required']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Required</span
                    >
                  }
                </div>
              }
            </div>

            <!-- Last Name -->
            <div class="floating-input-group">
              <input
                type="text"
                formControlName="lastName"
                id="register-lastname"
                placeholder=" "
                class="floating-input"
              />
              <label for="register-lastname" class="floating-label"
                >Last Name</label
              >
              @if (lastNameInvalid()) {
                <div class="absolute -bottom-5 left-0">
                  @if (registerForm.get('lastName')?.errors?.['required']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Required</span
                    >
                  }
                </div>
              }
            </div>

            <!-- Username (Async Backend Validated) -->
            <div class="floating-input-group sm:col-span-2">
              <input
                type="text"
                formControlName="username"
                id="register-username"
                placeholder=" "
                class="floating-input"
                libUsernameValidator
              />
              <label for="register-username" class="floating-label">Username</label>
              @if (usernameInvalid()) {
                <div class="absolute -bottom-5 left-0">
                  @if (registerForm.get('username')?.errors?.['required']) {
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Username is required</span>
                  }
                  @if (registerForm.get('username')?.errors?.['minlength']) {
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Min 3 characters required</span>
                  }
                  @if (registerForm.get('username')?.errors?.['usernameTaken']) {
                    <span class="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Username is already taken</span>
                  }
                </div>
              }
            </div>

            <!-- Work Email -->
            <div class="floating-input-group sm:col-span-2">
              <input
                type="email"
                formControlName="email"
                id="register-email"
                placeholder=" "
                class="floating-input"
              />
              <label for="register-email" class="floating-label"
                >Work Email</label
              >
              @if (emailInvalid()) {
                <div class="absolute -bottom-5 left-0">
                  @if (registerForm.get('email')?.errors?.['required']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Email is required</span
                    >
                  }
                  @if (registerForm.get('email')?.errors?.['email']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Invalid email format</span
                    >
                  }
                </div>
              }
            </div>

            <!-- Password -->
            <div class="floating-input-group sm:col-span-2">
              <input
                type="password"
                formControlName="password"
                id="register-password"
                placeholder=" "
                class="floating-input"
              />
              <label for="register-password" class="floating-label"
                >Password</label
              >
              @if (passwordInvalid()) {
                <div class="absolute -bottom-5 left-0">
                  @if (registerForm.get('password')?.errors?.['required']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Password is required</span
                    >
                  }
                  @if (registerForm.get('password')?.errors?.['minlength']) {
                    <span
                      class="text-[10px] text-rose-500 font-bold uppercase tracking-tight"
                      >Min 8 characters required</span
                    >
                  }
                </div>
              }
            </div>

            <!-- Terms -->
            <div class="sm:col-span-2 flex items-center gap-2.5 px-1">
              <input
                type="checkbox"
                formControlName="terms"
                id="terms"
                class="w-4 h-4 rounded bg-white dark:bg-dark-base border-slate-300 dark:border-white/[0.15] text-primary focus:ring-primary cursor-pointer"
              />
              <label
                for="terms"
                class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest cursor-pointer"
                >I agree to the Terms and Data Policy</label
              >
            </div>

            <button
              type="submit"
              [disabled]="isFormInvalid() || isLoading()"
              class="sm:col-span-2 btn-primary-premium !py-4 mt-2"
              id="register-submit"
            >
              <lib-loader
                [loading]="isLoading()"
                label="Create My Account"
              ></lib-loader>
            </button>
          </form>
        </div>

        <p class="text-center text-slate-500 dark:text-slate-400 text-xs mt-8">
          Already have an account?
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthStateService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  isLoading = signal(false);

  registerForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    terms: [false, Validators.requiredTrue],
  });

  // Signal for overall form validity
  private formStatus = toSignal(
    this.registerForm.statusChanges.pipe(
      startWith(this.registerForm.status),
      map((status) => status === 'INVALID'),
    ),
    { initialValue: true },
  );

  isFormInvalid = computed(() => this.formStatus());

  // Field validity signals
  usernameInvalid = toSignal(
    this.registerForm.get('username')!.statusChanges.pipe(
      startWith(this.registerForm.get('username')?.status),
      map(() => this.registerForm.get('username')?.touched && this.registerForm.get('username')?.invalid),
    ),
    { initialValue: false },
  );

  firstNameInvalid = toSignal(
    this.registerForm.get('firstName')!.statusChanges.pipe(
      startWith(this.registerForm.get('firstName')!.status),
      map(() => this.registerForm.get('firstName')!.touched && this.registerForm.get('firstName')!.invalid),
    ),
    { initialValue: false },
  );

  lastNameInvalid = toSignal(
    this.registerForm.get('lastName')!.statusChanges.pipe(
      startWith(this.registerForm.get('lastName')!.status),
      map(() => this.registerForm.get('lastName')!.touched && this.registerForm.get('lastName')!.invalid),
    ),
    { initialValue: false },
  );

  emailInvalid = toSignal(
    this.registerForm.get('email')!.statusChanges.pipe(
      startWith(this.registerForm.get('email')!.status),
      map(() => this.registerForm.get('email')!.touched && this.registerForm.get('email')!.invalid),
    ),
    { initialValue: false },
  );

  passwordInvalid = toSignal(
    this.registerForm.get('password')!.statusChanges.pipe(
      startWith(this.registerForm.get('password')!.status),
      map(() => this.registerForm.get('password')!.touched && this.registerForm.get('password')!.invalid),
    ),
    { initialValue: false },
  );

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);

      const payload = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`,
        company: 'Dev Corp',
      };

      this.http.post<any>(`${environment.apiUrl}/auth/register`, payload, { withCredentials: true }).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.notificationService.success('Account Created', 'Registration successful! Directing to dashboard.');

          this.auth.login({
            id: res.id,
            name: payload.name,
            email: payload.email,
            username: payload.username,
            roles: [res.role],
            avatarUrl: '',
          });

          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMsg = err.error?.detail || 'Failed to create your account.';
          this.notificationService.error('Registration Failed', errorMsg);
        },
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
