import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStateService, LoaderComponent, NotificationService } from 'ui-shared';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  template: `
    <div class="shopper-settings animate-fade-in">
      <header class="settings-head">
        <h1>Account Settings</h1>
        <p>Manage your account preferences and security.</p>
      </header>

      <div class="settings-layout">
        <!-- Sidebar Links (Compact) -->
        <aside class="settings-nav">
          <button class="nav-item active">General Information</button>
          <button class="nav-item">Security & Password</button>
          <button class="nav-item">Email Preferences</button>
          <button class="nav-item">Privacy Settings</button>
        </aside>

        <!-- Main Form Area -->
        <div class="settings-content">
          <!-- Profile Section -->
          <section class="settings-section shopper-card">
            <h3>Profile Information</h3>
            <form
              [formGroup]="profileForm"
              (ngSubmit)="saveProfile()"
              class="shopper-form"
            >
              <div class="f-row">
                <div class="f-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    formControlName="firstName"
                    placeholder="John"
                  />
                </div>
                <div class="f-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    formControlName="lastName"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div class="f-group">
                <label>Email Address</label>
                <input
                  type="email"
                  formControlName="email"
                  readonly
                  class="readonly"
                />
                <span class="tip"
                  >Your email is managed by the central authentication
                  service.</span
                >
              </div>

              <div class="f-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  formControlName="phone"
                  placeholder="+1 (000) 000-0000"
                />
              </div>

              <div class="f-actions">
                <button
                  type="submit"
                  class="btn-shopper-primary"
                  [disabled]="profileForm.invalid || loading()"
                >
                  <lib-loader [loading]="loading()" label="Save Changes"></lib-loader>
                </button>
              </div>
            </form>
          </section>

          <!-- Password Section -->
          <section class="settings-section shopper-card">
            <h3>Security</h3>
            <form
              [formGroup]="passwordForm"
              (ngSubmit)="changePassword()"
              class="shopper-form"
            >
              <div class="f-group">
                <label>Current Password</label>
                <input
                  type="password"
                  formControlName="currentPassword"
                  placeholder="••••••••"
                />
              </div>
              <div class="f-group">
                <label>New Password</label>
                <input
                  type="password"
                  formControlName="newPassword"
                  placeholder="At least 8 characters"
                />
              </div>
              <div class="f-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="Repeat new password"
                />
              </div>

              <div class="f-actions">
                <button
                  type="submit"
                  class="btn-shopper-outline"
                  [disabled]="passwordForm.invalid || loading()"
                >
                  <lib-loader [loading]="loading()" label="Update Security"></lib-loader>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .shopper-settings {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
        max-width: 1000px;
        margin: 0 auto;
      }

      .settings-head h1 {
        font-size: 2rem;
        font-weight: 800;
        margin: 0;
        color: var(--text);
        letter-spacing: -0.02em;
      }
      .settings-head p {
        font-size: 0.95rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
      }

      .settings-layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 3rem;
        align-items: start;
      }

      /* Settings Nav */
      .settings-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .nav-item {
        background: none;
        border: none;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-muted);
        text-align: left;
        cursor: pointer;
        transition: all 0.2s;
      }
      .nav-item:hover {
        color: var(--text);
        background: var(--bg);
      }
      .nav-item.active {
        color: var(--primary);
        background: var(--bg);
      }

      .settings-content {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .shopper-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 1.5rem;
        padding: 2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
      }
      .shopper-card h3 {
        font-size: 1.1rem;
        font-weight: 800;
        margin-bottom: 1.75rem;
        color: var(--text);
      }

      .shopper-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .f-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .f-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .f-group label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .f-group input {
        background: var(--bg);
        border: 1.5px solid var(--border);
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text);
        outline: none;
        transition: border-color 0.2s;
      }
      .f-group input:focus {
        border-color: var(--primary);
        background: var(--surface);
      }
      .f-group input.readonly {
        background: var(--bg);
        cursor: not-allowed;
        border-color: var(--border);
      }
      .f-group .tip {
        font-size: 0.7rem;
        color: var(--text-muted);
        font-weight: 600;
      }

      .f-actions {
        margin-top: 1rem;
      }
      .btn-shopper-primary {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.85rem 1.5rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-shopper-outline {
        background: var(--bg);
        border: 1.5px solid var(--border);
        color: var(--text);
        padding: 0.85rem 1.5rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-shopper-outline:hover {
        border-color: var(--primary);
        color: var(--primary);
      }

      @media (max-width: 768px) {
        .settings-layout {
          grid-template-columns: 1fr;
        }
        .settings-nav {
          display: none;
        }
      }
    `,
  ],
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthStateService);
  private notify = inject(NotificationService);

  loading = signal(false);

  profileForm: FormGroup = this.fb.group({
    firstName: [this.authService.user()?.name.split(' ')[0] || '', Validators.required],
    lastName: [this.authService.user()?.name.split(' ')[1] || '', Validators.required],
    email: [{ value: this.authService.user()?.email || '', disabled: true }],
    phone: ['+1 (555) 000-1234'],
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  saveProfile() {
    if (this.profileForm.valid) {
      this.loading.set(true);
      setTimeout(() => {
        this.loading.set(false);
        this.notify.success('Profile Saved', 'Your personal information has been updated.');
      }, 1000);
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      this.loading.set(true);
      setTimeout(() => {
        this.loading.set(false);
        this.notify.success('Password Updated', 'Your security settings have been changed successfully.');
        this.passwordForm.reset();
      }, 1500);
    }
  }
}
