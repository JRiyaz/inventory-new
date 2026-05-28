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
  type Product,
  SkuValidatorDirective,
  ValidationErrorPipe,
} from 'ui-shared';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CustomDropdownComponent,
    LoaderComponent,
    FormValidationDirective,
    ValidationErrorPipe,
    SkuValidatorDirective,
  ],
  template: `
    <div class="p-3 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      <nav
        class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6"
      >
        <a
          routerLink="/inventory/products"
          class="hover:text-primary transition-colors"
          >Inventory</a
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
            [routerLink]="['/inventory/products', productId]"
            class="hover:text-primary transition-colors"
            >{{ formData.name || "Product" }}</a
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
          <span class="text-slate-900 dark:text-white">Modify Record</span>
        } @else {
          <span class="text-slate-900 dark:text-white">New SKU</span>
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              }
            </svg>
          </div>
          <div>
            <h2
              class="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
            >
              {{
                isEditMode() ? "Modify Catalog Item" : "Register New Product"
              }}
            </h2>
            <p
              class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1"
            >
              {{
                isEditMode()
                  ? "System Asset ID: " + productId
                  : "Catalog Entry & Stock Initialization"
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
            <!-- SKU (Async Backend Validated) -->
            <div class="floating-input-group md:col-span-2">
              <input
                type="text"
                id="sku"
                name="sku"
                [(ngModel)]="formData.sku"
                placeholder=" "
                class="floating-input"
                required
                libSkuValidator
                #sku="ngModel"
                [disabled]="isEditMode()"
              />
              <label for="sku" class="floating-label">Product SKU (Unique)</label>
              @if (sku.invalid && sku.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  @if (sku.errors?.['required']) {
                    SKU is required
                  } @else if (sku.errors?.['skuTaken']) {
                    SKU already exists in catalog
                  }
                </p>
              }
            </div>

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
                >Product Name / Label</label
              >
              @if (name.invalid && name.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ name.errors | libValidationError: "Name" }}
                </p>
              }
            </div>

            <!-- Price -->
            <div class="floating-input-group">
              <input
                type="number"
                id="price"
                name="price"
                [(ngModel)]="formData.price"
                placeholder=" "
                class="floating-input"
                required
                min="0.01"
                #price="ngModel"
              />
              <label for="price" class="floating-label">Unit Price (USD)</label>
              @if (price.invalid && price.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ price.errors | libValidationError: "Price" }}
                </p>
              }
            </div>

            <!-- Stock -->
            <div class="floating-input-group">
              <input
                type="number"
                id="stock"
                name="stock"
                [(ngModel)]="formData.stock"
                placeholder=" "
                class="floating-input"
                required
                min="0"
                #stock="ngModel"
              />
              <label for="stock" class="floating-label"
                >Current Inventory Count</label
              >
              @if (stock.invalid && stock.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ stock.errors | libValidationError: "Stock" }}
                </p>
              }
            </div>

            <!-- Category Dropdown -->
            <div class="w-full">
              <label
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block"
                >Category</label
              >
              <lib-custom-dropdown
                [options]="categoryOptions"
                [value]="formData.category"
                [placeholder]="'Select Category'"
                (valueChange)="formData.category = $event"
              ></lib-custom-dropdown>
            </div>

            <!-- Supplier Dropdown -->
            <div class="w-full">
              <label
                class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block"
                >Primary Source</label
              >
              <lib-custom-dropdown
                [options]="service.supplierOptions()"
                [value]="formData.supplierId"
                [placeholder]="'Assign Supplier'"
                (valueChange)="formData.supplierId = $event"
              ></lib-custom-dropdown>
            </div>

            <!-- Description -->
            <div class="floating-input-group md:col-span-2">
              <input
                type="text"
                id="description"
                name="description"
                [(ngModel)]="formData.description"
                placeholder=" "
                class="floating-input"
                required
                #desc="ngModel"
              />
              <label for="description" class="floating-label"
                >Product Specifications / Description</label
              >
              @if (desc.invalid && desc.touched) {
                <p class="text-[9px] text-rose-500 font-black uppercase mt-1">
                  {{ desc.errors | libValidationError: "Description" }}
                </p>
              }
            </div>

            <!-- Discount (Edit Mode only) -->
            @if (isEditMode()) {
              <div class="floating-input-group md:col-span-2">
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  [(ngModel)]="formData.discount"
                  placeholder=" "
                  class="floating-input"
                />
                <label for="discount" class="floating-label"
                  >Promotional Discount (%)</label
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
                  ? ['/inventory/products', productId]
                  : ['/inventory/products']
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
                [label]="isEditMode() ? 'Save Changes' : 'Initialize SKU'"
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
export class ProductCreateComponent implements OnInit {
  public service = inject(ProductsService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = signal(false);
  productId: number | null = null;

  formData = {
    sku: '',
    name: '',
    price: 0,
    stock: 0,
    category: 'Electronics',
    description: '',
    supplierId: '',
    warehouseId: '',
    discount: 0,
  };

  categoryOptions: DropdownOption[] = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Industrial', label: 'Industrial' },
    { value: 'Raw Materials', label: 'Raw Materials' },
    { value: 'Computing', label: 'Computing' },
  ];

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.productId = Number(params['id']);
        this.loadProduct();
      }
    });
  }

  loadProduct() {
    if (!this.productId) return;
    const product = this.service.getProduct(this.productId);
    if (product) {
      this.formData = {
        sku: product.sku || '',
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        description: product.description,
        supplierId: product.supplierId || '',
        warehouseId: product.warehouseId || '',
        discount: product.discount || 0,
      };
    } else {
      this.notificationService.error('Product Not Found', 'The requested SKU could not be located.');
      this.router.navigate(['/inventory/products']);
    }
  }

  submitForm() {
    if (this.isEditMode()) {
      if (!this.productId) return;
      const updatedProduct: Product = {
        id: this.productId,
        ...this.formData,
      };

      this.service.updateProduct(updatedProduct).subscribe(() => {
        this.notificationService.success(
          'Update Successful',
          `${updatedProduct.name} has been modified in the catalog.`,
        );
        this.router.navigate(['/inventory/products', this.productId]);
      });
    } else {
      const newProduct: Product = {
        id: Math.floor(Math.random() * 1000000),
        ...this.formData,
      } as Product;

      this.service.addProduct(newProduct).subscribe(() => {
        this.notificationService.success(
          'Product Initialized',
          `${newProduct.name} has been added to the master catalog.`,
        );
        this.router.navigate(['/inventory/products', newProduct.id]);
      });
    }
  }
}
