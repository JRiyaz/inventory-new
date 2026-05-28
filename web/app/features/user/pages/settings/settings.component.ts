import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map, of, startWith } from 'rxjs';
import {
  AuthStateService,
  DisplayImageService,
  HasPermissionDirective,
  LoaderComponent,
  type LoaderType,
  NotificationService,
  SearchService,
  ThemeService,
  TypewriterComponent,
  UserSettingsService,
  WorkspaceService,
} from 'ui-shared';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoaderComponent,
    TypewriterComponent,
    HasPermissionDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="h-[calc(100vh-48px)] flex flex-col p-3 sm:p-5 max-w-7xl mx-auto animate-fade-in overflow-hidden"
    >
      <div class="flex-shrink-0 mb-5">
        <a
          routerLink="/inventory"
          class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all mb-4 group"
        >
          <svg
            class="w-3 h-3 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Back to Inventory Hub
        </a>

        <div class="flex justify-between items-center gap-4">
          <div>
            <h1
              class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white"
            >
              Settings
            </h1>
            <p
              class="text-slate-500 dark:text-slate-400 text-sm mt-1 h-5 flex items-center"
            >
              <lib-typewriter
                [words]="[
                  'Personalize your profile.',
                  'Manage account security.',
                  'Customize platform theme.',
                  'Configure workspace settings.',
                ]"
                [typeSpeed]="60"
                [deleteSpeed]="30"
                [delayBetweenWords]="3000"
              ></lib-typewriter>
            </p>
          </div>

          <!-- Sticky Floating Settings Save Button -->
          @if (userSettingsService.isDirty()) {
            <button
              (click)="saveChanges()"
              [disabled]="userSettingsService.isSaving()"
              class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-rose-500/30 border border-white/20 active:scale-95 transition-all animate-pulse"
            >
              @if (userSettingsService.isSaving()) {
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Save Changes</span>
              }
            </button>
          }
        </div>
      </div>

      <div class="flex-1 flex gap-5 overflow-hidden">
        <!-- Sidebar Navigation (Left Column) -->
        <div class="w-52 flex-shrink-0 overflow-y-auto custom-scrollbar pr-3">
          <div class="space-y-1.5">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                class="settings-tab-btn w-full px-3 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2.5 text-left group"
                [class.active]="activeTab() === tab.id"
                [class.bg-primary]="activeTab() === tab.id"
                [class.text-white]="activeTab() === tab.id"
                [class.shadow-xl]="activeTab() === tab.id"
                [class.shadow-primary/20]="activeTab() === tab.id"
                [class.text-slate-500]="activeTab() !== tab.id"
                [class.dark:text-slate-400]="activeTab() !== tab.id"
                [class.hover:bg-slate-50]="activeTab() !== tab.id"
                [class.dark:hover:bg-white/[0.03]]="activeTab() !== tab.id"
              >
                @if (tab.icon) {
                  <div
                    [innerHTML]="tab.icon"
                    class="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110"
                    [class.text-white]="activeTab() === tab.id"
                    [class.text-slate-400]="activeTab() !== tab.id"
                  ></div>
                }
                <span class="truncate">{{ tab.label }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Content Area (Right Column) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 min-w-0">
          <div class="pb-8">
            <!-- Profile Tab -->
            @if (activeTab() === 'profile') {
              <div class="space-y-6 animate-fade-in">
                <div class="card-premium p-6 sm:p-8">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-8"
                  >
                    Profile Information
                  </h3>
                  <div
                    class="flex flex-col sm:flex-row items-start gap-8 mb-10"
                  >
                    <div class="relative group">
                      <img
                        [src]="auth.avatarUrl()"
                        class="w-20 h-20 rounded-2xl border border-primary/30 object-cover"
                      />
                      <div
                        class="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      >
                        <svg
                          class="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          ></path>
                          <circle cx="12" cy="13" r="3"></circle>
                        </svg>
                      </div>
                    </div>
                    <div class="flex-1 w-full">
                      <form [formGroup]="profileForm" class="space-y-8">
                        <div
                          class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8"
                        >
                          <div class="floating-input-group">
                            <input
                              type="text"
                              formControlName="firstName"
                              placeholder=" "
                              class="floating-input"
                            />
                            <label class="floating-label">First Name</label>
                            @if (firstNameInvalid()) {
                              <div class="absolute -bottom-5 left-0">
                                <span
                                  class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                                  >Required</span
                                >
                              </div>
                            }
                          </div>
                          <div class="floating-input-group">
                            <input
                              type="text"
                              formControlName="lastName"
                              placeholder=" "
                              class="floating-input"
                            />
                            <label class="floating-label">Last Name</label>
                            @if (lastNameInvalid()) {
                              <div class="absolute -bottom-5 left-0">
                                <span
                                  class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                                  >Required</span
                                >
                              </div>
                            }
                          </div>
                          <div class="floating-input-group sm:col-span-2">
                            <input
                              type="email"
                              formControlName="email"
                              placeholder=" "
                              class="floating-input"
                            />
                            <label class="floating-label">Email Address</label>
                            @if (emailInvalid()) {
                              <div class="absolute -bottom-5 left-0">
                                @if (
                                  profileForm.get('email')?.errors?.['required']
                                ) {
                                  <span
                                    class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                                    >Email is required</span
                                  >
                                }
                                @if (
                                  profileForm.get('email')?.errors?.['email']
                                ) {
                                  <span
                                    class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                                    >Invalid format</span
                                  >
                                }
                              </div>
                            }
                          </div>
                          <div class="relative sm:col-span-2">
                            <input
                              type="text"
                              [value]="auth.userRoles().join(', ')"
                              disabled
                              class="w-full bg-transparent border-b-2 border-slate-100 dark:border-white/[0.04] py-2 text-sm text-slate-400 cursor-not-allowed opacity-60"
                            />
                            <label
                              class="absolute left-0 -top-3.5 text-slate-400 text-[10px] uppercase font-bold tracking-widest"
                              >Account Roles</label
                            >
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="saveProfile()"
                          [disabled]="
                            isProfileInvalid() ||
                            profileForm.pristine ||
                            isSavingProfile()
                          "
                          class="btn-primary-premium"
                        >
                          <lib-loader
                            [loading]="isSavingProfile()"
                            label="Save Profile"
                          ></lib-loader>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Roles Tab -->
            @if (activeTab() === 'roles') {
              <div class="space-y-6 animate-fade-in">
                <div class="card-premium p-6 sm:p-8">
                  <div class="flex justify-between items-center mb-6">
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest"
                      >
                        Role Management
                      </h3>
                      <p
                        class="text-[10px] text-slate-500 uppercase tracking-widest mt-1"
                      >
                        Configure roles, permissions matrix, and system access
                      </p>
                    </div>
                    <div
                      class="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg"
                    >
                      <span
                        class="text-[10px] font-black text-primary uppercase tracking-widest"
                        >System Roles: {{ auth.availableRoles().length }}</span
                      >
                    </div>
                  </div>

                  <!-- Fuzzy Search Autocomplete -->
                  <div class="relative mb-6">
                    <input
                      type="text"
                      [value]="roleSearchQuery()"
                      (input)="roleSearchQuery.set($any($event.target).value)"
                      placeholder="Fuzzy search roles..."
                      class="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    @if (roleSearchQuery()) {
                      <button
                        (click)="roleSearchQuery.set('')"
                        class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    }
                  </div>

                  <div class="space-y-4 mb-10">
                    @for (role of filteredRoles(); track role) {
                      <div
                        class="flex flex-col gap-4 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl transition-all hover:border-primary/30"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <div
                              [class.bg-primary]="auth.hasRole(role)"
                              [class.bg-slate-200]="!auth.hasRole(role)"
                              class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(109,116,255,0.5)]"
                            ></div>
                            <span
                              class="text-sm font-black text-slate-900 dark:text-white tracking-wide"
                              >{{ role }}</span
                            >
                          </div>
                          <div class="flex items-center gap-4">
                            <button
                              (click)="toggleRole(role)"
                              [class.text-primary]="auth.hasRole(role)"
                              [class.text-slate-400]="!auth.hasRole(role)"
                              class="flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 rounded-lg transition-all"
                            >
                              @if (auth.hasRole(role)) {
                                <svg
                                  class="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="3"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                              }
                              {{ auth.hasRole(role) ? 'Assigned' : 'Assign' }}
                            </button>
                            
                            <!-- Delete button restricted via custom functional guards / directives -->
                            <button
                              *libHasPermission="'can_write'"
                              (click)="deleteRole(role)"
                              class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- CRUD Permissions Matrix (Wired directly to backend) -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/50 dark:border-white/[0.04]">
                          @for (pKey of ['can_read', 'can_write', 'can_update', 'can_delete']; track pKey) {
                            <label class="flex items-center gap-2 cursor-pointer group select-none">
                              <input
                                type="checkbox"
                                [disabled]="userSettingsService.isSavingPermissions()"
                                [checked]="getRolePermissionFlag(role, pKey)"
                                (change)="toggleRolePermission(role, pKey)"
                                class="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                              />
                              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                {{ pKey.replace('can_', '') }}
                              </span>
                            </label>
                          }
                        </div>
                      </div>
                    } @empty {
                      <div class="text-center py-10 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl text-slate-400">
                        No system roles found matching your query.
                      </div>
                    }
                  </div>

                  <div
                    *libHasPermission="'can_write'"
                    class="pt-8 border-t border-slate-100 dark:border-white/5"
                  >
                    <label class="label-premium block mb-4"
                      >Create New Role</label
                    >
                    <div class="flex gap-3">
                      <div class="floating-input-group flex-1">
                        <input
                          type="text"
                          [value]="newRoleName()"
                          (input)="newRoleName.set($any($event.target).value)"
                          (keyup.enter)="addRole()"
                          placeholder=" "
                          class="floating-input"
                          id="new-role"
                        />
                        <label class="floating-label" for="new-role"
                          >Role Name</label
                        >
                      </div>
                      <button
                        (click)="addRole()"
                        class="btn-primary-premium flex items-center justify-center gap-2 group"
                      >
                        <svg
                          class="w-4 h-4 group-hover:rotate-45 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M12 4v16m8-8H4"
                          ></path>
                        </svg>
                        <span>Add Role</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Security Tab -->
            @if (activeTab() === 'security') {
              <div class="space-y-6 animate-fade-in">
                <div class="card-premium p-6 sm:p-8">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-10"
                  >
                    Change Password
                  </h3>
                  <form [formGroup]="securityForm" class="space-y-10 max-w-md">
                    <div class="floating-input-group">
                      <input
                        type="password"
                        formControlName="currentPassword"
                        placeholder=" "
                        class="floating-input"
                      />
                      <label class="floating-label">Current Password</label>
                      @if (currentPasswordInvalid()) {
                        <div class="absolute -bottom-5 left-0">
                          <span
                            class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                            >Required</span
                          >
                        </div>
                      }
                    </div>
                    <div class="floating-input-group">
                      <input
                        type="password"
                        formControlName="newPassword"
                        placeholder=" "
                        class="floating-input"
                      />
                      <label class="floating-label">New Password</label>
                      @if (newPasswordInvalid()) {
                        <div class="absolute -bottom-5 left-0">
                          @if (
                            securityForm.get('newPassword')?.errors?.[
                              'required'
                            ]
                          ) {
                            <span
                              class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                              >Required</span
                            >
                          }
                          @if (
                            securityForm.get('newPassword')?.errors?.[
                              'minlength'
                            ]
                          ) {
                            <span
                              class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                              >Min 8 characters</span
                            >
                          }
                        </div>
                      }
                    </div>
                    <div class="floating-input-group">
                      <input
                        type="password"
                        formControlName="confirmPassword"
                        placeholder=" "
                        class="floating-input"
                      />
                      <label class="floating-label">Confirm Password</label>
                      @if (confirmPasswordInvalid()) {
                        <div class="absolute -bottom-5 left-0">
                          @if (
                            securityForm.get('confirmPassword')?.errors?.[
                              'required'
                            ]
                          ) {
                            <span
                              class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                              >Required</span
                            >
                          }
                          @if (securityForm.errors?.['mismatch']) {
                            <span
                              class="text-[9px] text-rose-500 font-bold uppercase tracking-tight"
                              >Passwords do not match</span
                            >
                          }
                        </div>
                      }
                    </div>
                    <button
                      type="button"
                      (click)="saveSecurity()"
                      [disabled]="
                        isSecurityInvalid() ||
                        securityForm.pristine ||
                        isSavingSecurity()
                      "
                      class="btn-primary-premium"
                    >
                      <lib-loader
                        [loading]="isSavingSecurity()"
                        label="Update Password"
                      ></lib-loader>
                    </button>
                  </form>
                </div>
              </div>
            }

            <!-- Appearance Tab -->
            @if (activeTab() === 'appearance') {
              <div class="space-y-6 animate-fade-in">
                <div class="card-premium p-6 sm:p-8">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6"
                  >
                    Application Theme
                  </h3>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
                  >
                    @for (theme of themes; track theme.id) {
                      <div
                        class="bg-slate-50 dark:bg-white/[0.03] border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] relative group overflow-hidden"
                        [class.border-primary]="
                          themeService.currentTheme() === theme.id
                        "
                        [class.border-slate-200]="
                          themeService.currentTheme() !== theme.id
                        "
                        [class.dark:border-white/[0.08]]="
                          themeService.currentTheme() !== theme.id
                        "
                        (click)="themeService.setTheme(theme.id); userSettingsService.markDirty()"
                      >
                        <div
                          class="h-20 rounded-lg mb-3 shadow-inner"
                          [style.background]="theme.preview"
                        ></div>
                        <p
                          class="text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {{ theme.name }}
                        </p>
                        <p
                          class="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5"
                        >
                          {{ theme.desc }}
                        </p>
                        @if (themeService.currentTheme() === theme.id) {
                          <div
                            class="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Loading Animation Section -->
                <div class="card-premium p-6 sm:p-8">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6"
                  >
                    Loading Animation
                  </h3>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    @for (loader of loaders; track loader.id) {
                      <div
                        class="bg-slate-50 dark:bg-white/[0.03] border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] relative group overflow-hidden"
                        [class.border-primary]="
                          themeService.currentLoader() === loader.id
                        "
                        [class.border-slate-200]="
                          themeService.currentLoader() !== loader.id
                        "
                        [class.dark:border-white/[0.08]]="
                          themeService.currentLoader() !== loader.id
                        "
                        (click)="themeService.setLoader(loader.id); userSettingsService.markDirty()"
                      >
                        <div
                          class="h-20 rounded-lg mb-3 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden"
                        >
                          <lib-loader
                            [type]="loader.id"
                            [loading]="isPreviewLoading()"
                            customClass="scale-[2] !text-primary"
                          ></lib-loader>
                        </div>
                        <p
                          class="text-xs font-bold text-slate-900 dark:text-white"
                        >
                          {{ loader.name }}
                        </p>
                        <p
                          class="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5"
                        >
                          {{ loader.desc }}
                        </p>
                        @if (themeService.currentLoader() === loader.id) {
                          <div
                            class="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Animation Tempo Section -->
                <div class="card-premium p-6 sm:p-8 mt-6">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6"
                  >
                    Animation Tempo
                  </h3>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    @for (tempo of tempos; track tempo.value) {
                      <div
                        class="bg-slate-50 dark:bg-white/[0.03] border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] relative"
                        [class.border-primary]="
                          themeService.loaderDuration() === tempo.value
                        "
                        [class.border-slate-200]="
                          themeService.loaderDuration() !== tempo.value
                        "
                        [class.dark:border-white/[0.08]]="
                          themeService.loaderDuration() !== tempo.value
                        "
                        (click)="themeService.setLoaderDuration(tempo.value); userSettingsService.markDirty()"
                      >
                        <div class="flex items-center justify-between mb-2">
                          <span
                            class="text-xs font-bold text-slate-900 dark:text-white"
                            >{{ tempo.label }}</span
                          >
                          @if (themeService.loaderDuration() === tempo.value) {
                            <div
                              class="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center"
                            >
                              <svg
                                class="w-2.5 h-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="4"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            </div>
                          }
                        </div>
                        <p
                          class="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {{ tempo.desc }}
                        </p>
                        <div
                          class="mt-3 h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden"
                        >
                          <div
                            class="h-full bg-primary transition-all"
                            [style.width.%]="
                              themeService.loaderDuration() === tempo.value
                                ? 100
                                : 0
                            "
                            [style.transition-duration.ms]="tempo.value"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                  <p
                    class="text-[10px] text-slate-400 dark:text-slate-500 mt-4 italic"
                  >
                    * Minimum duration the loader stays visible to ensure smooth
                    transitions.
                  </p>
                </div>

                <!-- Image Preferences Section (Inventory Hub Only) -->
                <div class="card-premium p-6 sm:p-8 mt-6">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6"
                  >
                    Inventory Hub Preferences
                  </h3>
                  <div
                    class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                      <div>
                        <h4
                          class="text-sm font-bold text-slate-900 dark:text-white"
                        >
                          Display Product Images
                        </h4>
                        <p
                          class="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
                        >
                          Toggle showing product visuals on listings and detail pages in Inventory Hub.
                        </p>
                      </div>
                    </div>
                    <button
                      (click)="
                        displayImageService.setDisplayImage(
                          !displayImageService.displayImage()
                        );
                        userSettingsService.markDirty()
                      "
                      class="w-11 h-6 rounded-full transition-colors relative"
                      [class.bg-primary]="displayImageService.displayImage()"
                      [class.bg-slate-300]="!displayImageService.displayImage()"
                      [class.dark:bg-white/10]="
                        !displayImageService.displayImage()
                      "
                      aria-label="Toggle product images display"
                    >
                      <div
                        class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
                        [class.translate-x-5]="
                          displayImageService.displayImage()
                        "
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Notifications Tab -->
            @if (activeTab() === 'notifications') {
              <div class="space-y-6 animate-fade-in">
                <div class="card-premium p-6 sm:p-8">
                  <h3
                    class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6"
                  >
                    Notification Behavior
                  </h3>
                  <div class="space-y-6">
                    <div
                      class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            ></path>
                          </svg>
                        </div>
                        <div>
                          <h4
                            class="text-sm font-bold text-slate-900 dark:text-white"
                          >
                            Do Not Disturb
                          </h4>
                          <p
                            class="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
                          >
                            Mute all toast notifications while keeping them in
                            history.
                          </p>
                        </div>
                      </div>
                      <button
                        (click)="
                          notificationService.updateConfig({
                            dnd: !notificationService.config().dnd,
                          });
                          userSettingsService.markDirty()
                        "
                        class="w-11 h-6 rounded-full transition-colors relative"
                        [class.bg-primary]="notificationService.config().dnd"
                        [class.bg-slate-300]="!notificationService.config().dnd"
                        [class.dark:bg-white/10]="
                          !notificationService.config().dnd
                        "
                      >
                        <div
                          class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
                          [class.translate-x-5]="
                            notificationService.config().dnd
                          "
                        ></div>
                      </button>
                    </div>
                    <div
                      class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"
                        >
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            ></path>
                          </svg>
                        </div>
                        <div>
                          <h4
                            class="text-sm font-bold text-slate-900 dark:text-white"
                          >
                            Urgent Persistence
                          </h4>
                          <p
                            class="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
                          >
                            Critical alerts stay on screen until manually
                            dismissed.
                          </p>
                        </div>
                      </div>
                      <button
                        (click)="
                          notificationService.updateConfig({
                            urgentStick:
                              !notificationService.config().urgentStick,
                          });
                          userSettingsService.markDirty()
                        "
                        class="w-11 h-6 rounded-full transition-colors relative"
                        [class.bg-primary]="
                          notificationService.config().urgentStick
                        "
                        [class.bg-slate-300]="
                          !notificationService.config().urgentStick
                        "
                        [class.dark:bg-white/10]="
                          !notificationService.config().urgentStick
                        "
                      >
                        <div
                          class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
                          [class.translate-x-5]="
                            notificationService.config().urgentStick
                          "
                        ></div>
                      </button>
                    </div>
                    <div
                      class="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl"
                    >
                      <div class="flex justify-between items-center mb-3">
                        <label
                          class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]"
                          >Display Duration</label
                        >
                        <span class="text-xs font-mono text-primary font-bold"
                          >{{
                            notificationService.config().duration / 1000
                          }}s</span
                        >
                      </div>
                      <input
                        type="range"
                        min="2000"
                        max="10000"
                        step="500"
                        [value]="notificationService.config().duration"
                        (input)="updateDuration($event)"
                        class="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div
                        class="flex justify-between mt-2 text-[10px] text-slate-400 font-medium"
                      >
                        <span>2s</span>
                        <span>5s</span>
                        <span>10s</span>
                      </div>
                    </div>
                    <div
                      class="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl"
                    >
                      <label
                        class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] block mb-4"
                        >On-Screen Placement</label
                      >
                      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        @for (pos of placements; track pos.id) {
                          <button
                            (click)="
                              notificationService.updateConfig({
                                placement: pos.id,
                              });
                              userSettingsService.markDirty()
                            "
                            class="p-3 border rounded-xl flex flex-col items-center gap-2 transition-all"
                            [class.border-primary]="
                              notificationService.config().placement === pos.id
                            "
                            [class.bg-primary/5]="
                              notificationService.config().placement === pos.id
                            "
                            [class.border-slate-200]="
                              notificationService.config().placement !== pos.id
                            "
                            [class.dark:border-white/10]="
                              notificationService.config().placement !== pos.id
                            "
                          >
                            <div
                              class="w-full aspect-[4/3] bg-slate-100 dark:bg-white/5 rounded border border-slate-200 dark:border-white/10 relative overflow-hidden"
                            >
                              <div
                                class="absolute w-2.5 h-2.5 bg-primary rounded-sm shadow-[0_0_8px_rgba(109,116,255,0.5)]"
                                [style.top]="
                                  pos.id.startsWith('top') ? '4px' : 'auto'
                                "
                                [style.bottom]="
                                  pos.id.startsWith('bottom') ? '4px' : 'auto'
                                "
                                [style.left]="
                                  pos.id.endsWith('left') ? '4px' : 'auto'
                                "
                                [style.right]="
                                  pos.id.endsWith('right') ? '4px' : 'auto'
                                "
                              ></div>
                            </div>
                            <span
                              class="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 text-center"
                              >{{ pos.label }}</span
                            >
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                  <div
                    class="mt-8 pt-6 border-t border-slate-200 dark:border-white/[0.06] flex gap-3"
                  >
                    <button
                      (click)="testUrgent()"
                      class="flex-1 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-bold text-xs hover:bg-rose-500/20 transition-all uppercase tracking-widest"
                    >
                      Test Urgent
                    </button>
                    <button
                      (click)="
                        notificationService.success(
                          'System Check',
                          'All modules are operating normally.'
                        )
                      "
                      class="flex-1 px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-bold text-xs hover:bg-green-500/20 transition-all uppercase tracking-widest"
                    >
                      Test Standard
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Workspaces Tab -->
            @if (activeTab() === 'workspaces') {
              <div class="space-y-6 animate-fade-in">
                <div class="flex flex-col items-center justify-center mb-4">
                  <div
                    class="bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
                  >
                    <div
                      class="w-2 h-2 bg-primary rounded-full animate-pulse"
                    ></div>
                    <span
                      class="text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                      >Platform v1.2.4-stable</span
                    >
                  </div>
                </div>
                <div class="card-premium p-6 sm:p-8">
                  <div class="flex justify-between items-center mb-6">
                    <div>
                      <h3
                        class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest"
                      >
                        Project Workspaces
                      </h3>
                      <p class="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                        Decoupled Micro-Frontends and API nodes
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <button
                        (click)="loadHealth()"
                        [disabled]="isRefreshingHealth()"
                        class="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        @if (isRefreshingHealth()) {
                          <svg class="animate-spin h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Refreshing...</span>
                        } @else {
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 11H18.66"></path>
                          </svg>
                          <span>Refresh Health</span>
                        }
                      </button>
                      <span
                        class="px-2.5 py-1.5 bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-green-500/20"
                        >{{
                          workspaceService.subProjects().length
                        }}
                        Connected</span
                      >
                    </div>
                  </div>
                  <div class="space-y-4">
                    @for (
                      project of projectsWithDetails;
                      track project.name;
                      let i = $index
                    ) {
                      <div
                        class="group relative bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden transition-all hover:border-primary/40"
                        [class.ring-2]="
                          workspaceService.selectedProjectIndex() === i
                        "
                        [class.ring-primary/30]="
                          workspaceService.selectedProjectIndex() === i
                        "
                        (click)="workspaceService.selectProject(i)"
                      >
                        @if (workspaceService.selectedProjectIndex() === i) {
                          <div
                            class="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                          ></div>
                        }
                        <div class="p-5 flex flex-col sm:flex-row gap-5">
                          <div class="flex-shrink-0">
                            <div
                              class="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm"
                            >
                              <svg
                                class="w-7 h-7"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="1.5"
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                ></path>
                              </svg>
                            </div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between mb-2">
                              <h4
                                class="text-base font-black text-slate-900 dark:text-white truncate flex items-center gap-2"
                              >
                                {{ project.name }}
                                @if (
                                  workspaceService.selectedProjectIndex() === i
                                ) {
                                  <span
                                    class="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded uppercase font-bold"
                                    >Active</span
                                  >
                                }
                              </h4>
                              <span class="flex items-center gap-1.5">
                                <span
                                  class="w-2 h-2 rounded-full animate-pulse"
                                  [class.bg-green-400]="
                                    project.status === 'running'
                                  "
                                  [class.bg-red-400]="
                                    project.status === 'offline' || project.status === 'error'
                                  "
                                ></span>
                                <span
                                  class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                                  >{{ project.status }}</span
                                >
                              </span>
                            </div>
                            <div
                              class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4"
                            >
                              <div class="space-y-1">
                                <p
                                  class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                >
                                  Address
                                </p>
                                <p
                                  class="text-xs font-mono text-slate-700 dark:text-slate-300"
                                >
                                  {{ project.ip }}
                                </p>
                              </div>
                              <div class="space-y-1">
                                <p
                                  class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                >
                                  Port
                                </p>
                                <p
                                  class="text-xs font-mono text-slate-700 dark:text-slate-300"
                                >
                                  {{ project.port }}
                                </p>
                              </div>
                              <div class="space-y-1">
                                <p
                                  class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                >
                                  Version
                                </p>
                                <p
                                  class="text-xs font-mono text-slate-700 dark:text-slate-300"
                                >
                                  v{{ project.version }}
                                </p>
                              </div>
                              <div class="space-y-1">
                                <p
                                  class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                                >
                                  Protocol
                                </p>
                                <p
                                  class="text-xs font-mono text-slate-700 dark:text-slate-300"
                                >
                                  HTTP/1.1
                                </p>
                              </div>
                            </div>
                            <div
                              class="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5"
                            >
                              <p
                                class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"
                              >
                                Active Services
                              </p>
                              <div class="flex flex-wrap gap-2">
                                @for (svc of project.services; track svc) {
                                  <div
                                    class="px-2 py-1 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-bold text-primary uppercase tracking-tight"
                                  >
                                    {{ svc }}
                                  </div>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          class="px-5 py-2.5 bg-slate-100 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/[0.06] flex justify-between items-center"
                        >
                          <span
                            class="text-[9px] text-slate-500 font-medium italic"
                            >Last heartbeat: {{ project.lastSeen }}</span
                          >
                          <div class="flex items-center gap-3">
                            <button
                              (click)="loadHealth(); $event.stopPropagation()"
                              class="text-[10px] font-bold text-primary uppercase hover:underline"
                            >
                              Re-ping
                            </button>
                            <button
                              (click)="$event.stopPropagation()"
                              class="text-[10px] font-bold text-slate-500 uppercase hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              Logs
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(109, 116, 255, 0.4) transparent;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(109, 116, 255, 0.02);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(109, 116, 255, 0.3);
      border-radius: 10px;
      border: 1px solid transparent;
      background-clip: padding-box;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(109, 116, 255, 0.6);
    }
    :root[data-theme='glass'] .settings-tab-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    :root[data-theme='glass'] .settings-tab-btn.active {
      background: rgba(109, 116, 255, 0.3) !important;
      backdrop-filter: blur(8px);
      border-color: rgba(109, 116, 255, 0.4);
    }
    :root[data-theme='glass'].dark .settings-tab-btn {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `,
})
export class SettingsComponent {
  tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>',
    },
    {
      id: 'roles',
      label: 'Access Control',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
    },
    {
      id: 'security',
      label: 'Security',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>',
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>',
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: '<svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
    },
  ];

  activeTab = signal('profile');
  newRoleName = signal('');
  isSavingProfile = signal(false);
  isSavingSecurity = signal(false);
  isPreviewLoading = signal(true);

  // Auth, state and settings services
  auth = inject(AuthStateService);
  themeService = inject(ThemeService);
  displayImageService = inject(DisplayImageService);
  notificationService = inject(NotificationService);
  workspaceService = inject(WorkspaceService);
  searchService = inject(SearchService);
  userSettingsService = inject(UserSettingsService);

  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  // Search input for role management autocomplete
  roleSearchQuery = signal('');

  // Health query state
  healthData = signal<any>(null);
  isRefreshingHealth = signal(false);

  // Fuzzy autocomplete computed roles list
  filteredRoles = computed(() => {
    const q = this.roleSearchQuery().toLowerCase().trim();
    if (!q) return this.auth.availableRoles();
    return this.auth.availableRoles().filter((r) => r.toLowerCase().includes(q));
  });

  constructor() {
    // Cycle the preview loaders so user can see the "hold" duration effect
    setInterval(() => {
      this.isPreviewLoading.set(false);
      setTimeout(() => {
        this.isPreviewLoading.set(true);
      }, 2000);
    }, 4000);
  }

  ngOnInit(): void {
    // Fetch and sync user settings & role permissions from DB
    this.userSettingsService.loadAndApplySettings();
    this.loadHealth();

    // Deep link support for tabs via query parameters
    this.route.queryParamMap.subscribe((params) => {
      const tabId = params.get('tab');
      if (tabId && this.tabs.some((t) => t.id === tabId)) {
        this.activeTab.set(tabId);
      }
    });

    // Dynamic Search Provider Registration
    this.searchService.registerProvider({
      id: 'user-settings',
      name: 'Settings',
      search: (query: string) => {
        const q = query.toLowerCase();
        const settingsItems = [
          {
            id: 'settings-profile',
            title: 'User Profile Settings',
            path: '/user/settings',
            category: 'Settings',
            queryParams: { tab: 'profile' },
          },
          {
            id: 'settings-security',
            title: 'Security & Password',
            path: '/user/settings',
            category: 'Settings',
            queryParams: { tab: 'security' },
          },
          {
            id: 'settings-appearance',
            title: 'Appearance & Themes',
            path: '/user/settings',
            category: 'Settings',
            queryParams: { tab: 'appearance' },
          },
          {
            id: 'settings-notifications',
            title: 'Notification Preferences',
            path: '/user/settings',
            category: 'Settings',
            queryParams: { tab: 'notifications' },
          },
          {
            id: 'settings-workspaces',
            title: 'Workspace Configuration',
            path: '/user/settings',
            category: 'Settings',
            queryParams: { tab: 'workspaces' },
          },
        ];
        return of(settingsItems.filter((item) => item.title.toLowerCase().includes(q)));
      },
    });
  }

  ngOnDestroy(): void {
    this.searchService.unregisterProvider('user-settings');
  }

  // --- Real-time Gateway Health Probe ---
  loadHealth() {
    this.isRefreshingHealth.set(true);
    this.http.get<any>('http://localhost:3000/health').subscribe({
      next: (data) => {
        this.healthData.set(data);
        this.isRefreshingHealth.set(false);
      },
      error: () => {
        this.isRefreshingHealth.set(false);
      },
    });
  }

  get projectsWithDetails() {
    const versions = ['1.2.4', '1.1.2', '1.0.0'];
    const subProjects = this.workspaceService.subProjects();
    const h = this.healthData();

    return subProjects.map((p, i) => {
      const key = p.name.toLowerCase().replace(/\s+/g, '-');
      let status: any = p.status;
      let lastSeen = i === 0 ? 'Live' : `${i * 2 + 1} mins ago`;

      if (h?.services) {
        let gateKey = '';
        if (key.includes('shell')) gateKey = 'frontend-shell';
        else if (key.includes('user')) gateKey = 'user-service';
        else if (key.includes('inventory')) gateKey = 'inventory-hub';
        else if (key.includes('store')) gateKey = 'store-service';

        if (gateKey && h.services[gateKey]) {
          const sObj = h.services[gateKey];
          status = sObj.online ? 'running' : 'offline';
          lastSeen = sObj.online ? 'Live' : 'Offline';
        }
      }

      return {
        ...p,
        status: status,
        ip: `192.168.1.${10 + i}`,
        version: p.name.includes('Shell') ? '1.2.4' : versions[i % versions.length],
        lastSeen: lastSeen,
        services: p.services || ['Core Module'],
      };
    });
  }

  // --- Persistent Settings Saving Bridge ---
  saveChanges() {
    this.userSettingsService.saveSettings().then((success) => {
      if (success) {
        this.notificationService.success(
          'Settings Persisted',
          'Preferences successfully committed to sqlite database.',
        );
      } else {
        this.notificationService.error('Save Failed', 'Could not synchronize preferences to the user-service backend.');
      }
    });
  }

  // --- CRUD Role Permissions Checkbox Matrix Operations ---
  getRolePermissionFlag(role: string, pKey: string): boolean {
    const perm = this.userSettingsService.allRolePermissions().find((p) => p.role === role);
    if (!perm) return false;
    return (perm as any)[pKey] === true;
  }

  toggleRolePermission(role: string, pKey: string) {
    const perm = this.userSettingsService.allRolePermissions().find((p) => p.role === role);
    const currentPerms = perm || { can_read: true, can_write: false, can_update: false, can_delete: false };
    const updated = {
      can_read: currentPerms.can_read,
      can_write: currentPerms.can_write,
      can_update: currentPerms.can_update,
      can_delete: currentPerms.can_delete,
      [pKey]: !(currentPerms as any)[pKey],
    };

    this.userSettingsService.saveRolePermissions(role, updated).then((success) => {
      if (success) {
        this.notificationService.success(
          'Permission Saved',
          `Successfully updated "${pKey.replace('can_', '')}" flag for role: ${role}`,
        );
      } else {
        this.notificationService.error('Save Failed', `Failed to save permissions for role: ${role}`);
      }
    });
  }

  // --- Role Management Operations ---
  addRole() {
    const role = this.newRoleName().trim();
    if (role) {
      this.auth.addSystemRole(role);
      this.newRoleName.set('');

      // Seed default permissions for this new role on backend
      const defaultPerms = { can_read: true, can_write: false, can_update: false, can_delete: false };
      this.userSettingsService.saveRolePermissions(role, defaultPerms);

      this.notificationService.success('Role Created', `Added "${role}" to system roles database.`);
    }
  }

  deleteRole(role: string) {
    if (this.auth.availableRoles().length <= 1) {
      this.notificationService.error('Action Restricted', 'Cannot delete the last remaining system role.');
      return;
    }
    this.auth.deleteSystemRole(role);
    this.notificationService.success('Role Removed', `Deleted "${role}" from the system.`);
  }

  toggleRole(role: string) {
    this.auth.toggleRole(role);
    const hasRole = this.auth.hasRole(role);
    this.notificationService.success(
      'Permissions Updated',
      `${hasRole ? 'Assigned' : 'Removed'} "${role}" permissions.`,
    );
  }

  placements: { id: any; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  tempos = [
    { label: 'Instant', value: 0, desc: 'No simulated delay' },
    { label: 'Quick', value: 400, desc: 'Fast feedback' },
    { label: 'Default', value: 800, desc: 'Balanced motion' },
    { label: 'Smooth', value: 1500, desc: 'Elegant tempo' },
  ];

  themes = [
    {
      id: 'void-blue',
      name: 'Void Blue',
      desc: 'Deep Space',
      preview: 'linear-gradient(135deg, #060714, #111333, #6d74ff)',
    },
    {
      id: 'emerald',
      name: 'Emerald',
      desc: 'Deep Jungle',
      preview: 'linear-gradient(135deg, #020d0a, #06241c, #10b981)',
    },
    {
      id: 'glass',
      name: 'Glass',
      desc: 'Frosted Refraction',
      preview: 'radial-gradient(circle at 15% 15%, #6d74ff 0%, #060714 100%)',
    },
    {
      id: 'rose',
      name: 'Rose',
      desc: 'Crimson Velvet',
      preview: 'linear-gradient(135deg, #0d0408, #260c19, #f43f5e)',
    },
    {
      id: 'obsidian',
      name: 'Obsidian',
      desc: 'Midnight Orchid',
      preview: 'linear-gradient(135deg, #080511, #180f31, #a855f7)',
    },
    {
      id: 'gold',
      name: 'Gold',
      desc: 'Warm Luxury',
      preview: 'linear-gradient(135deg, #14120a, #35301b, #d4af37)',
    },
  ];

  loaders: { id: LoaderType; name: string; desc: string }[] = [
    { id: 'bloom', name: 'Bloom', desc: 'Modern morphing' },
    { id: 'windows', name: 'Fluent', desc: 'Circular Jitter' },
    { id: 'flower', name: 'Flower', desc: 'Soft petals' },
    { id: 'gravity', name: 'Gravity', desc: 'Orbital energy' },
    { id: 'pulse', name: 'Pulse', desc: 'Expanding rings' },
    { id: 'liquid', name: 'Liquid', desc: 'Fluid morph' },
  ];

  profileForm: FormGroup = this.fb.group({
    firstName: ['Riyaz', Validators.required],
    lastName: ['Khan', Validators.required],
    email: ['riyaz@company.com', [Validators.required, Validators.email]],
  });

  securityForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  // Signal Bridges for Profile Form
  private profileStatus = toSignal(
    this.profileForm.statusChanges.pipe(
      startWith(this.profileForm.status),
      map((s) => s === 'INVALID'),
    ),
    { initialValue: false },
  );
  isProfileInvalid = computed(() => this.profileStatus());

  firstNameInvalid = toSignal(
    this.profileForm.get('firstName')!.statusChanges.pipe(
      startWith(this.profileForm.get('firstName')!.status),
      map(() => this.profileForm.get('firstName')!.touched && this.profileForm.get('firstName')!.invalid),
    ),
    { initialValue: false },
  );

  lastNameInvalid = toSignal(
    this.profileForm.get('lastName')!.statusChanges.pipe(
      startWith(this.profileForm.get('lastName')!.status),
      map(() => this.profileForm.get('lastName')!.touched && this.profileForm.get('lastName')!.invalid),
    ),
    { initialValue: false },
  );

  emailInvalid = toSignal(
    this.profileForm.get('email')!.statusChanges.pipe(
      startWith(this.profileForm.get('email')!.status),
      map(() => this.profileForm.get('email')!.touched && this.profileForm.get('email')!.invalid),
    ),
    { initialValue: false },
  );

  // Signal Bridges for Security Form
  private securityStatus = toSignal(
    this.securityForm.statusChanges.pipe(
      startWith(this.securityForm.status),
      map((s) => s === 'INVALID'),
    ),
    { initialValue: true },
  );
  isSecurityInvalid = computed(() => this.securityStatus());

  currentPasswordInvalid = toSignal(
    this.securityForm.get('currentPassword')!.statusChanges.pipe(
      startWith(this.securityForm.get('currentPassword')!.status),
      map(() => this.securityForm.get('currentPassword')!.touched && this.securityForm.get('currentPassword')!.invalid),
    ),
    { initialValue: false },
  );

  newPasswordInvalid = toSignal(
    this.securityForm.get('newPassword')!.statusChanges.pipe(
      startWith(this.securityForm.get('newPassword')!.status),
      map(() => this.securityForm.get('newPassword')!.touched && this.securityForm.get('newPassword')!.invalid),
    ),
    { initialValue: false },
  );

  confirmPasswordInvalid = toSignal(
    this.securityForm.statusChanges.pipe(
      startWith(this.securityForm.status),
      map(
        () =>
          this.securityForm.get('confirmPassword')?.touched &&
          (this.securityForm.get('confirmPassword')?.invalid || this.securityForm.errors?.['mismatch']),
      ),
    ),
    { initialValue: false },
  );

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.isSavingProfile.set(true);
      setTimeout(() => {
        this.isSavingProfile.set(false);
        this.profileForm.markAsPristine();
        this.notificationService.success('Profile Updated', 'Your profile information has been saved successfully.');
      }, 1500);
    }
  }

  saveSecurity() {
    if (this.securityForm.valid) {
      this.isSavingSecurity.set(true);
      setTimeout(() => {
        this.isSavingSecurity.set(false);
        this.securityForm.reset();
        this.notificationService.success('Password Changed', 'Your security credentials have been updated.');
      }, 2000);
    }
  }

  updateDuration(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.notificationService.updateConfig({ duration: parseInt(value, 10) });
    this.userSettingsService.markDirty();
  }

  testUrgent() {
    this.notificationService.notify(
      'error',
      'Security Breach',
      'Detected unauthorized access attempt from IP 192.168.1.45',
      true,
    );
  }
}
