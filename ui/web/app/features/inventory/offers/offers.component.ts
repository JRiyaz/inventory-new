import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CustomDropdownComponent,
  type DropdownOption,
  InventoryDataService,
  LoaderComponent,
  NotificationService,
  type Offer,
  SkeletonComponent,
} from 'ui-shared';
import { OffersService } from './offers.service';

@Component({
  selector: 'app-offers-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent, SkeletonComponent, CustomDropdownComponent],
  template: `
    <div class="offers-admin p-6 animate-fade-in">
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">
            Promotions & Offers
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Manage storefront carousels and product discounts.
          </p>
        </div>
        <button
          (click)="showForm.set(true)"
          class="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <lib-loader label="Create New Offer"></lib-loader>
        </button>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Offers List -->
        <div class="lg:col-span-2 space-y-4">
          @if (service.isLoading()) {
            <div class="space-y-4">
              @for (i of [1, 2, 3, 4]; track i) {
                <div
                  class="bg-white dark:bg-dark-card border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-6 animate-pulse"
                >
                  <lib-skeleton
                    width="64px"
                    height="64px"
                    shape="rounded"
                  ></lib-skeleton>
                  <div class="flex-1 space-y-3">
                    <div class="flex items-center gap-2">
                      <lib-skeleton
                        width="80px"
                        height="16px"
                        shape="rounded"
                      ></lib-skeleton>
                      <lib-skeleton
                        width="120px"
                        height="10px"
                        shape="rounded"
                      ></lib-skeleton>
                    </div>
                    <lib-skeleton
                      width="60%"
                      height="20px"
                      shape="rounded"
                    ></lib-skeleton>
                    <lib-skeleton
                      width="90%"
                      height="12px"
                      shape="rounded"
                    ></lib-skeleton>
                  </div>
                  <div class="text-right space-y-3">
                    <lib-skeleton
                      width="100px"
                      height="10px"
                      shape="rounded"
                      class="ml-auto"
                    ></lib-skeleton>
                    <div class="flex gap-3 justify-end">
                      <lib-skeleton
                        width="40px"
                        height="12px"
                        shape="rounded"
                      ></lib-skeleton>
                      <lib-skeleton
                        width="40px"
                        height="12px"
                        shape="rounded"
                      ></lib-skeleton>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            @for (offer of service.offers(); track offer.id) {
              <div
                class="bg-white dark:bg-dark-card border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-6 shadow-sm hover:shadow-md transition-all"
              >
                <div
                  class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                  [style.background]="offer.color + '22'"
                  [style.color]="offer.color"
                >
                  🎁
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded"
                      [style.background]="offer.color + '22'"
                      [style.color]="offer.color"
                    >
                      {{ offer.discount }}% OFF
                    </span>
                    @if (offer.category) {
                      <span
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >Category: {{ offer.category }}</span
                      >
                    }
                    @if (offer.productId) {
                      <span
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >Product ID: {{ offer.productId }}</span
                      >
                    }
                  </div>
                  <h3 class="font-bold text-slate-900 dark:text-white">
                    {{ offer.title }}
                  </h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ offer.description }}
                  </p>
                </div>
                <div class="text-right">
                  <span
                    class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"
                    >Expires: {{ offer.expiryDate }}</span
                  >
                  <div class="flex items-center gap-3">
                    <button
                      (click)="editOffer(offer)"
                      class="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      (click)="confirmDelete(offer.id)"
                      class="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div
                class="py-20 text-center bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
              >
                <p class="text-slate-400 italic">No active promotions found.</p>
              </div>
            }
          }
        </div>

        <!-- Create Form Sidebar/Modal -->
        @if (showForm()) {
          <div
            class="bg-white dark:bg-dark-card border border-slate-100 dark:border-white/5 rounded-2xl p-6 shadow-2xl sticky top-6 animate-slide-up"
          >
            <div class="flex justify-between items-center mb-6">
              <h2
                class="font-black text-slate-900 dark:text-white uppercase tracking-tight"
              >
                {{ isEditMode() ? "Modify Promotion" : "New Promotion" }}
              </h2>
              <button
                (click)="cancelEdit()"
                class="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form
              [formGroup]="offerForm"
              (ngSubmit)="saveOffer()"
              class="space-y-5"
            >
              <div>
                <label
                  class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                  >Offer Title</label
                >
                <input
                  type="text"
                  formControlName="title"
                  placeholder="e.g. Summer Sale"
                  class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-sm outline-none focus:border-primary transition-all dark:text-white"
                />
              </div>

              <div>
                <label
                  class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                  >Description</label
                >
                <textarea
                  formControlName="description"
                  rows="3"
                  placeholder="Tell users about this offer..."
                  class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-sm outline-none focus:border-primary transition-all dark:text-white"
                ></textarea>
              </div>

              <div>
                <lib-custom-dropdown
                  [options]="productDropdownOptions()"
                  [value]="offerForm.get('productId')?.value"
                  placeholder="Target Product (Optional)"
                  (valueChange)="offerForm.get('productId')?.setValue($event)"
                ></lib-custom-dropdown>
              </div>

              <div>
                <label
                  class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                  >Discount %</label
                >
                <div class="relative">
                  <input
                    type="number"
                    formControlName="discount"
                    class="w-full bg-slate-50 dark:bg-white/5 border-b-2 border-slate-200 dark:border-white/10 p-3 pl-8 text-sm font-bold outline-none focus:border-primary transition-all dark:text-white"
                  />
                  <span
                    class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                    >%</span
                  >
                </div>
              </div>

              <div>
                <label
                  class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                  >Expiry Date</label
                >
                <input
                  type="date"
                  formControlName="expiryDate"
                  class="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-sm outline-none focus:border-primary transition-all dark:text-white"
                />
              </div>

              <div class="pt-4">
                <button
                  type="submit"
                  [disabled]="offerForm.invalid || service.isActionLoading()"
                  class="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                >
                  <lib-loader
                    [loading]="service.isActionLoading()"
                    [label]="
                      isEditMode() ? 'Save Changes' : 'Publish Promotion'
                    "
                  ></lib-loader>
                </button>
              </div>
            </form>
          </div>
        }
      </div>
    </div>

    <!-- Modern Delete Confirmation Popup -->
    @if (showDeleteConfirm()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          (click)="showDeleteConfirm.set(false)"
        ></div>
        <div
          class="card-premium w-full max-w-sm overflow-hidden z-10 animate-scale-in shadow-2xl border-rose-500/20"
        >
          <div class="p-6">
            <div
              class="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-rose-500"
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
            </div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Remove Promotion?
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This action cannot be undone. The offer will be immediately
              removed from the storefront and customer carousels.
            </p>
            <div class="flex gap-3">
              <button
                (click)="showDeleteConfirm.set(false)"
                class="btn-secondary-premium flex-1 !px-4 !py-2.5"
              >
                Cancel
              </button>
              <button
                (click)="executeDelete()"
                class="bg-rose-500 text-white flex-1 rounded-xl font-black text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <lib-loader
                  [loading]="service.isActionLoading()"
                  label="Delete Offer"
                ></lib-loader>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class OffersComponent implements OnInit {
  public service = inject(OffersService);
  private dataService = inject(InventoryDataService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  products = this.dataService.products;

  productDropdownOptions = computed<DropdownOption[]>(() => {
    const options: DropdownOption[] = [{ label: 'No specific product', value: null }];

    this.products().forEach((p) => {
      options.push({
        label: p.name,
        value: p.id,
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
      });
    });

    return options;
  });

  showForm = signal(false);
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  deletingOfferId = signal<string | null>(null);

  offerForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    discount: [10, [Validators.required, Validators.min(1)]],
    color: ['#4f46e5', Validators.required],
    expiryDate: ['', Validators.required],
    category: [''],
    productId: [null],
  });

  ngOnInit() {
    this.service.isLoading.set(true);
    const sub = this.service.getOffersData().subscribe({
      next: (offers) => {
        this.service.setOffers(offers);
        this.service.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading offers:', err);
        this.service.isLoading.set(false);
      },
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  editOffer(offer: Offer) {
    this.isEditMode.set(true);
    this.editingId.set(offer.id);
    this.offerForm.patchValue({
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      color: offer.color || '#4f46e5',
      expiryDate: offer.expiryDate,
      category: offer.category || '',
      productId: (offer.productId as any) || null,
    });
    this.showForm.set(true);
  }

  cancelEdit() {
    this.showForm.set(false);
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.offerForm.reset({ color: '#4f46e5', discount: 10 });
  }

  saveOffer() {
    if (this.offerForm.invalid) return;

    if (this.isEditMode()) {
      const id = this.editingId();
      if (!id) return;

      const updatedOffer: Offer = {
        id,
        ...this.offerForm.value,
        productId: this.offerForm.value.productId ? Number(this.offerForm.value.productId) : undefined,
      } as Offer;

      this.service.updateOffer(updatedOffer).subscribe(() => {
        this.notify.success('Offer Updated', `"${updatedOffer.title}" has been successfully modified.`);
        this.cancelEdit();
      });
    } else {
      const newOffer: Offer = {
        id: `OFFER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        ...this.offerForm.value,
        productId: this.offerForm.value.productId ? Number(this.offerForm.value.productId) : undefined,
      } as Offer;

      this.service.addOffer(newOffer).subscribe(() => {
        this.notify.success('Offer Created', `"${newOffer.title}" is now live on the storefront.`);
        this.cancelEdit();
      });
    }
  }

  confirmDelete(id: string) {
    this.deletingOfferId.set(id);
    this.showDeleteConfirm.set(true);
  }

  executeDelete() {
    const id = this.deletingOfferId();
    if (!id) return;

    this.service.deleteOffer(id).subscribe(() => {
      this.notify.info('Offer Deleted', 'The promotion has been removed.');
      this.showDeleteConfirm.set(false);
      this.deletingOfferId.set(null);
    });
  }
}
