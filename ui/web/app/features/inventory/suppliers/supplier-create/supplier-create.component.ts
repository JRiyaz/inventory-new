import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CustomDropdownComponent,
  type DropdownOption,
  FormValidationDirective,
  LoaderComponent,
  NotificationService,
  type Supplier,
  ValidationErrorPipe,
} from 'ui-shared';
import { SuppliersService } from '../suppliers.service';

@Component({
  selector: 'app-supplier-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomDropdownComponent,
    LoaderComponent,
    FormValidationDirective,
    ValidationErrorPipe,
  ],
  template: `
    <div class="p-3 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      <nav
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
      >
        <a
          routerLink="/inventory/suppliers"
          class="hover:text-primary transition-colors"
          >Suppliers</a
        >
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M9 5l7 7-7 7"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        @if (isEditMode()) {
          <a
            [routerLink]="['/inventory/suppliers', supplierId]"
            class="hover:text-primary transition-colors"
            >{{ formData.name || "Supplier" }}</a
          >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5l7 7-7 7"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-slate-900 dark:text-white">Update Profile</span>
        } @else {
          <span class="text-slate-900 dark:text-white">New Vendor</span>
        }
      </nav>

      <div class="card-premium p-8">
        <div
          class="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100 dark:border-white/5"
        >
          <div
            class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              @if (isEditMode()) {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              } @else {
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              }
            </svg>
          </div>
          <div>
            <h2
              class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              {{
                isEditMode() ? "Modify Vendor Records" : "Onboard New Supplier"
              }}
            </h2>
            <p
              class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1"
            >
              {{
                isEditMode()
                  ? "System Entity ID: " + supplierId
                  : "Supply Chain Node Registration"
              }}
            </p>
          </div>
        </div>

        <form
          (ngSubmit)="submitForm()"
          class="space-y-8"
          #f="ngForm"
          libFormValidation
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <!-- Name -->
            <div class="floating-input-group md:col-span-2">
              <input
                type="text"
                id="name"
                name="name"
                [(ngModel)]="formData.name"
                placeholder=" "
                class="floating-input"
                required
                #name="ngModel"
              />
              <label for="name" class="floating-label"
                >Supplier Entity Name</label
              >
              @if (name.invalid && name.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ name.errors | libValidationError: "Name" }}
                </p>
              }
            </div>

            <!-- Category -->
            <div class="floating-input-group">
              <input
                type="text"
                id="category"
                name="category"
                [(ngModel)]="formData.category"
                placeholder=" "
                class="floating-input"
                required
                #category="ngModel"
              />
              <label for="category" class="floating-label"
                >Primary Goods Category</label
              >
              @if (category.invalid && category.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ category.errors | libValidationError: "Category" }}
                </p>
              }
            </div>

            <!-- Reliability -->
            <div class="floating-input-group">
              <input
                type="number"
                id="reliability"
                name="reliability"
                [(ngModel)]="formData.reliability"
                placeholder=" "
                class="floating-input"
                required
                min="0"
                max="100"
                #reliability="ngModel"
              />
              <label for="reliability" class="floating-label"
                >Reliability Score (0-100)</label
              >
              @if (reliability.invalid && reliability.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ reliability.errors | libValidationError: "Reliability" }}
                </p>
              }
            </div>

            <!-- Email -->
            <div class="floating-input-group">
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="formData.email"
                placeholder=" "
                class="floating-input"
                required
                email
                #email="ngModel"
              />
              <label for="email" class="floating-label"
                >Procurement Email</label
              >
              @if (email.invalid && email.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ email.errors | libValidationError: "Email" }}
                </p>
              }
            </div>

            <!-- Phone -->
            <div class="floating-input-group">
              <input
                type="tel"
                id="phone"
                name="phone"
                [(ngModel)]="formData.phone"
                placeholder=" "
                class="floating-input"
                required
                #phone="ngModel"
              />
              <label for="phone" class="floating-label">Contact Number</label>
              @if (phone.invalid && phone.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ phone.errors | libValidationError: "Phone" }}
                </p>
              }
            </div>

            <!-- Location -->
            <div class="floating-input-group md:col-span-2">
              <input
                type="text"
                id="location"
                name="location"
                [(ngModel)]="formData.location"
                placeholder=" "
                class="floating-input"
                required
                #location="ngModel"
              />
              <label for="location" class="floating-label"
                >Operational HQ Location</label
              >
              @if (location.invalid && location.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ location.errors | libValidationError: "Location" }}
                </p>
              }
            </div>

            <!-- Status (Edit Mode only) -->
            @if (isEditMode()) {
              <div class="w-full md:col-span-2">
                <label
                  class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block"
                  >Partnership Status</label
                >
                <lib-custom-dropdown
                  [options]="statusOptions"
                  [value]="formData.status"
                  (valueChange)="formData.status = $event"
                ></lib-custom-dropdown>
              </div>
            }
          </div>

          <div
            class="flex justify-end gap-4 pt-6 border-t border-slate-100 dark:border-white/5 mt-10"
          >
            <button
              type="button"
              [routerLink]="
                isEditMode()
                  ? ['/inventory/suppliers', supplierId]
                  : ['/inventory/suppliers']
              "
              class="btn-secondary-premium"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="service.isActionLoading() || f.invalid"
              class="btn-primary-premium min-w-[160px]"
            >
              <lib-loader
                [loading]="service.isActionLoading()"
                [label]="isEditMode() ? 'Save Changes' : 'Finalize Onboarding'"
              ></lib-loader>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SupplierCreateComponent implements OnInit {
  public service = inject(SuppliersService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  supplierId: string = '';

  formData = {
    name: '',
    category: '',
    email: '',
    phone: '',
    location: '',
    reliability: 100,
    status: 'Active' as 'Active' | 'Pending' | 'Inactive' | 'Critical',
  };

  statusOptions: DropdownOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Critical', label: 'Critical' },
  ];

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.supplierId = params['id'];
        this.loadSupplier();
      }
    });
  }

  loadSupplier() {
    const supplier = this.service.getSupplier(this.supplierId);
    if (supplier) {
      this.formData = {
        name: supplier.name,
        category: supplier.category,
        email: supplier.email || '',
        phone: supplier.phone,
        location: supplier.location,
        reliability: supplier.reliability,
        status: supplier.status,
      };
    } else {
      this.notificationService.error('Supplier Not Found', 'The requested vendor record could not be found.');
      this.router.navigate(['/inventory/suppliers']);
    }
  }

  submitForm() {
    if (this.isEditMode()) {
      const updatedSupplier: Supplier = {
        id: this.supplierId,
        ...this.formData,
      };

      this.service.updateSupplier(updatedSupplier).subscribe(() => {
        this.notificationService.success('Update Successful', `${updatedSupplier.name}'s profile has been updated.`);
        this.router.navigate(['/inventory/suppliers', this.supplierId]);
      });
    } else {
      const newSupplier: Supplier = {
        id: `SUP-${Math.floor(1000 + Math.random() * 9000)}`,
        ...this.formData,
        status: 'Active',
      };

      this.service.addSupplier(newSupplier).subscribe(() => {
        this.notificationService.success(
          'Onboarding Successful',
          `${newSupplier.name} has been added to the vendor network.`,
        );
        this.router.navigate(['/inventory/suppliers', newSupplier.id]);
      });
    }
  }
}
