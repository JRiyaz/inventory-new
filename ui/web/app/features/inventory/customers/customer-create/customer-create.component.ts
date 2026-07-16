import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CustomDropdownComponent,
  type Customer,
  type DropdownOption,
  FormValidationDirective,
  LoaderComponent,
  NotificationService,
  ValidationErrorPipe,
} from 'ui-shared';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customer-create',
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
          routerLink="/inventory/customers"
          class="hover:text-primary transition-colors"
          >Customers</a
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
            [routerLink]="['/inventory/customers', customerId]"
            class="hover:text-primary transition-colors"
            >{{ formData.name || "Customer" }}</a
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
          <span class="text-slate-900 dark:text-white"
            >Update Relationship</span
          >
        } @else {
          <span class="text-slate-900 dark:text-white">New Relationship</span>
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              }
            </svg>
          </div>
          <div>
            <h2
              class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              {{
                isEditMode() ? "Modify Client Records" : "Onboard New Client"
              }}
            </h2>
            <p
              class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1"
            >
              {{
                isEditMode()
                  ? "Updating Profile: " + customerId
                  : "Industrial & Commercial Sector Registration"
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
            <!-- Full Name -->
            <div class="floating-input-group">
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
              <label for="name" class="floating-label">Full Legal Name</label>
              @if (name.invalid && name.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ name.errors | libValidationError: "Name" }}
                </p>
              }
            </div>

            <!-- Company -->
            <div class="floating-input-group">
              <input
                type="text"
                id="company"
                name="company"
                [(ngModel)]="formData.company"
                placeholder=" "
                class="floating-input"
                required
                #company="ngModel"
              />
              <label for="company" class="floating-label"
                >Enterprise Entity</label
              >
              @if (company.invalid && company.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ company.errors | libValidationError: "Company" }}
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
              <label for="email" class="floating-label">Business Email</label>
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
                >Primary HQ Address</label
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
                  >Account Status</label
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
                  ? ['/inventory/customers', customerId]
                  : ['/inventory/customers']
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
                [label]="
                  isEditMode() ? 'Save Changes' : 'Finalize Registration'
                "
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
export class CustomerCreateComponent implements OnInit {
  public service = inject(CustomersService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  customerId: string = '';

  formData = {
    name: '',
    company: '',
    email: '',
    phone: '',
    location: '',
    status: 'Active' as 'Active' | 'Inactive',
    joinDate: new Date().toISOString().split('T')[0],
  };

  statusOptions: DropdownOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.customerId = params['id'];
        this.loadCustomer();
      }
    });
  }

  loadCustomer() {
    const customer = this.service.getCustomer(this.customerId);
    if (customer) {
      this.formData = {
        name: customer.name,
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone,
        location: customer.location || '',
        status: customer.status,
        joinDate: customer.joinDate,
      };
    } else {
      this.notificationService.error('Customer Not Found', 'The client record could not be found.');
      this.router.navigate(['/inventory/customers']);
    }
  }

  submitForm() {
    if (this.isEditMode()) {
      const updatedCustomer: Customer = {
        id: this.customerId,
        ...this.formData,
        segment: 'Standard', // Default for now
        orders: 0,
        spend: 0,
      };

      this.service.updateCustomer(updatedCustomer).subscribe(() => {
        this.notificationService.success('Update Successful', `${this.formData.name}'s profile has been updated.`);
        this.router.navigate(['/inventory/customers', this.customerId]);
      });
    } else {
      const newCustomer: Customer = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        ...this.formData,
        segment: 'Standard',
        orders: 0,
        spend: 0,
      };

      this.service.addCustomer(newCustomer).subscribe(() => {
        this.notificationService.success(
          'Registration Successful',
          `${this.formData.name} has been added to the directory.`,
        );
        this.router.navigate(['/inventory/customers']);
      });
    }
  }
}
