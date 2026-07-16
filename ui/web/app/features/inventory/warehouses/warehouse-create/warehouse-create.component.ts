import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormValidationDirective,
  LoaderComponent,
  NotificationService,
  ValidationErrorPipe,
  type Warehouse,
} from 'ui-shared';
import { WarehousesService } from '../warehouses.service';

@Component({
  selector: 'app-warehouse-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LoaderComponent, FormValidationDirective, ValidationErrorPipe],
  template: `
    <div class="p-3 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      <nav
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
      >
        <a
          routerLink="/inventory/warehouses"
          class="hover:text-primary transition-colors"
          >Logistics</a
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
            [routerLink]="['/inventory/warehouses', warehouseId]"
            class="hover:text-primary transition-colors"
            >{{ formData.name || "Facility" }}</a
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
            >Adjust Specifications</span
          >
        } @else {
          <span class="text-slate-900 dark:text-white">New Facility</span>
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
                isEditMode()
                  ? "Modify Logistics Node"
                  : "Register New Logistics Node"
              }}
            </h2>
            <p
              class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1"
            >
              {{
                isEditMode()
                  ? "Updating Infrastructure: " + warehouseId
                  : "Spatial Asset Initialization"
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
              <label for="name" class="floating-label">Facility Name</label>
              @if (name.invalid && name.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ name.errors | libValidationError: "Name" }}
                </p>
              }
            </div>

            <!-- Location -->
            <div class="floating-input-group">
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
                >Geographic Location</label
              >
              @if (location.invalid && location.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ location.errors | libValidationError: "Location" }}
                </p>
              }
            </div>

            <!-- Capacity -->
            <div class="floating-input-group">
              <input
                type="number"
                id="capacity"
                name="capacity"
                [(ngModel)]="formData.totalCapacity"
                placeholder=" "
                class="floating-input"
                required
                min="1000"
                #capacity="ngModel"
              />
              <label for="capacity" class="floating-label"
                >Total Unit Capacity</label
              >
              @if (capacity.invalid && capacity.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ capacity.errors | libValidationError: "Capacity" }}
                </p>
              }
            </div>

            <!-- Manager -->
            <div class="floating-input-group md:col-span-2">
              <input
                type="text"
                id="manager"
                name="manager"
                [(ngModel)]="formData.manager"
                placeholder=" "
                class="floating-input"
                required
                #manager="ngModel"
              />
              <label for="manager" class="floating-label"
                >Operational Lead / Manager</label
              >
              @if (manager.invalid && manager.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ manager.errors | libValidationError: "Manager" }}
                </p>
              }
            </div>

            <!-- Last Audit (Edit Mode only) -->
            @if (isEditMode()) {
              <div class="floating-input-group md:col-span-2">
                <input
                  type="date"
                  id="lastAudit"
                  name="lastAudit"
                  [(ngModel)]="formData.lastAudit"
                  placeholder=" "
                  class="floating-input"
                  required
                />
                <label for="lastAudit" class="floating-label"
                  >Last Safety & Inventory Audit</label
                >
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
                  ? ['/inventory/warehouses', warehouseId]
                  : ['/inventory/warehouses']
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
                [label]="isEditMode() ? 'Save Changes' : 'Initialize Facility'"
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
export class WarehouseCreateComponent implements OnInit {
  public service = inject(WarehousesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  warehouseId: string = '';

  formData = {
    name: '',
    location: '',
    totalCapacity: 50000,
    manager: '',
    lastAudit: '',
  };

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.warehouseId = params['id'];
        this.loadWarehouse();
      }
    });
  }

  loadWarehouse() {
    const warehouse = this.service.getWarehouse(this.warehouseId);
    if (warehouse) {
      this.formData = {
        name: warehouse.name,
        location: warehouse.location,
        totalCapacity: warehouse.totalCapacity,
        manager: warehouse.manager || '',
        lastAudit: warehouse.lastAudit || '',
      };
    } else {
      this.notificationService.error('Facility Not Found', 'The logistics node could not be found.');
      this.router.navigate(['/inventory/warehouses']);
    }
  }

  submitForm() {
    const warehouse: Warehouse = {
      id: this.isEditMode() ? this.warehouseId : `WH-${Math.floor(100 + Math.random() * 900)}`,
      ...this.formData,
      status: 'Active',
      utilization: this.isEditMode() ? this.service.getWarehouse(this.warehouseId)?.utilization || 0 : 0,
      currentStock: this.isEditMode() ? this.service.getWarehouse(this.warehouseId)?.currentStock || 0 : 0,
      zones: this.isEditMode() ? this.service.getWarehouse(this.warehouseId)?.zones || [] : [],
    };

    const action = this.isEditMode() ? this.service.updateWarehouse(warehouse) : this.service.addWarehouse(warehouse);

    action.subscribe(() => {
      this.notificationService.success(
        this.isEditMode() ? 'Update Successful' : 'Facility Registered',
        this.isEditMode()
          ? `${warehouse.name} specifications have been updated.`
          : `${warehouse.name} is now active in the logistics network.`,
      );
      this.router.navigate(['/inventory/warehouses', warehouse.id]);
    });
  }
}
