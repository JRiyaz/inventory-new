import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DraggableDirective, DroppableDirective, NotificationService, TypewriterComponent } from 'ui-shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DraggableDirective, DroppableDirective, TypewriterComponent],
  template: `
    <div class="p-4 sm:p-5 max-w-6xl mx-auto animate-fade-in">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-3"
      >
        <div>
          <h2
            class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            Inventory Hub
          </h2>
          <p
            class="text-slate-500 dark:text-slate-400 text-sm mt-1 h-5 flex items-center"
          >
            <lib-typewriter
              [words]="[
                'Track your global inventory.',
                'Monitor upcoming orders.',
                'Optimize supply chain logistics.',
                'Manage regional warehouses.',
              ]"
              [typeSpeed]="60"
              [deleteSpeed]="30"
              [delayBetweenWords]="3000"
            ></lib-typewriter>
          </p>
        </div>
        <div class="flex items-center gap-3 relative">
          <!-- Services Status Dropdown / Popover -->
          <div class="relative">
            <button
              (click)="toggleSyncMenu()"
              class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:border-primary/40 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300"
            >
              <span class="w-2 h-2 rounded-full" [class.bg-green-500]="isAllServicesHealthy()" [class.bg-amber-500]="!isAllServicesHealthy()"></span>
              <span>Services Status</span>
              <svg class="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Popover Dropdown -->
            @if (showSyncMenu()) {
              <div
                class="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in"
              >
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400">System Decoupled Services</h4>
                <div class="space-y-2">
                  @for (svc of getServicesList(); track svc.name) {
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-700 dark:text-slate-300">{{ svc.name }}</span>
                      <span class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-500]="svc.online" [class.bg-red-500]="!svc.online"></span>
                        <span class="text-[9px] uppercase font-black tracking-wider text-slate-500">{{ svc.online ? 'Online' : 'Offline' }}</span>
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Fresh Sync Reload Button -->
          <button
            (click)="syncData()"
            [disabled]="isSyncing()"
            class="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            @if (isSyncing()) {
              <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing...</span>
            } @else {
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 11H18.66"></path>
              </svg>
              <span>Sync Data</span>
            }
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
      >
        @for (stat of stats; track stat.label; let i = $index) {
          <div
            class="card-premium p-3.5 group hover:border-primary/30 transition-all hover:scale-[1.02] cursor-default"
            [class]="'border-l-4 ' + stat.borderColor"
          >
            <p class="label-premium mb-1">
              {{ stat.label }}
            </p>
            <div class="flex items-end justify-between">
              <h3 class="text-xl font-black text-slate-900 dark:text-white">
                {{ stat.value }}
              </h3>
              <p
                class="text-[10px] font-black uppercase"
                [class]="stat.changeColor"
              >
                {{ stat.change }}
              </p>
            </div>
          </div>
        }
      </div>

      <!-- Kanban Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        @for (col of columns; track col.title; let colIndex = $index) {
          <div
            class="flex flex-col rounded-xl p-3 min-h-[350px] border border-transparent transition-all"
            uiDroppable
            (dropped)="onItemDrop($event, colIndex)"
          >
            <div
              class="flex items-center justify-between mb-4 flex-shrink-0 relative pb-3 border-b border-slate-200 dark:border-white/[0.08]"
            >
              <div class="flex items-center gap-2">
                <span
                  class="text-xs font-black uppercase tracking-[0.2em]"
                  [class]="col.color"
                  >{{ col.title }}</span
                >
                <span
                  class="px-2 py-0.5 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400"
                  >{{ col.items.length }}</span
                >
              </div>
              <!-- Drop Indicator Line -->
              <div
                class="drop-indicator absolute bottom-[-1px] left-0 w-full h-[2px] bg-transparent transition-all duration-300"
              ></div>
            </div>
            <!-- Droppable area -->
            <div class="flex-1 space-y-3">
              @for (item of col.items; track item.id) {
                <div
                  [uiDraggable]="{ item: item, sourceColIndex: colIndex }"
                  class="card-premium p-3 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group active:scale-[0.98]"
                >
                  <div class="flex justify-between items-start mb-2">
                    <span
                      class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider"
                      [class]="item.priorityClass"
                      >{{ item.priority }}</span
                    >
                    <span
                      class="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest group-hover:text-primary transition-colors"
                      >{{ item.id }}</span
                    >
                  </div>
                  <h4
                    class="font-bold text-sm text-slate-900 dark:text-white mb-2 leading-snug"
                  >
                    {{ item.title }}
                  </h4>
                  <p
                    class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3"
                  >
                    {{ item.description }}
                  </p>
                  <div
                    class="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/[0.04]"
                  >
                    <div class="flex -space-x-2">
                      @for (a of item.avatars; track a) {
                        <div class="relative">
                          <img
                            [src]="a"
                            class="w-6 h-6 rounded-full border-2 border-white dark:border-dark-elevated shadow-sm"
                          />
                        </div>
                      }
                    </div>
                    <div
                      class="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"
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
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span class="text-[10px] font-bold">{{ item.due }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .ui-drag-over .drop-indicator {
        background-color: var(--theme-primary);
        box-shadow: 0 0 12px var(--theme-primary);
      }
    `,
  ],
})
export class DashboardComponent {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  showSyncMenu = signal(false);
  isSyncing = signal(false);
  healthData = signal<any>(null);

  ngOnInit() {
    this.refreshHealth();
  }

  toggleSyncMenu() {
    this.showSyncMenu.set(!this.showSyncMenu());
  }

  refreshHealth() {
    this.http.get<any>('http://localhost:3000/health').subscribe({
      next: (data) => {
        this.healthData.set(data);
      },
      error: () => {
        // Silently catch or handle
      },
    });
  }

  isAllServicesHealthy(): boolean {
    const data = this.healthData();
    if (!data?.services) return false;
    return Object.values(data.services).every((s: any) => s.online === true);
  }

  getServicesList() {
    const data = this.healthData();
    if (!data?.services) {
      return [
        { name: 'Gateway', online: true },
        { name: 'User Service', online: false },
        { name: 'Inventory Hub', online: false },
        { name: 'Store Service', online: false },
      ];
    }
    const services = data.services;
    return [
      { name: 'Gateway', online: services['api-gateway']?.online ?? true },
      { name: 'User Service', online: services['user-service']?.online ?? false },
      { name: 'Inventory Hub', online: services['inventory-hub']?.online ?? false },
      { name: 'Store Service', online: services['store-service']?.online ?? false },
    ];
  }

  syncData() {
    this.isSyncing.set(true);
    this.refreshHealth();
    setTimeout(() => {
      this.isSyncing.set(false);
      this.notificationService.success('Sync Completed', 'All live inventories and customer records synchronised.');
    }, 1200);
  }
  stats = [
    {
      label: 'Total Products',
      value: '2,481',
      change: '↑ 12% from last month',
      borderColor: 'border-l-blue-500',
      changeColor: 'text-green-400',
    },
    {
      label: 'Low Stock',
      value: '23',
      change: '↓ 5 since yesterday',
      borderColor: 'border-l-amber-500',
      changeColor: 'text-green-400',
    },
    {
      label: 'Orders Pending',
      value: '142',
      change: '↑ 8 new today',
      borderColor: 'border-l-primary',
      changeColor: 'text-primary',
    },
    {
      label: 'Active Suppliers',
      value: '124',
      change: '↑ 4 this week',
      borderColor: 'border-l-indigo-500',
      changeColor: 'text-green-400',
    },
    {
      label: 'Wh. Capacity',
      value: '78%',
      change: 'Optimum range',
      borderColor: 'border-l-rose-500',
      changeColor: 'text-rose-400',
    },
  ];

  onItemDrop(data: any, targetColIndex: number) {
    const { item, sourceColIndex } = data;
    if (sourceColIndex === targetColIndex) return;

    // Remove from source
    this.columns[sourceColIndex].items = this.columns[sourceColIndex].items.filter((i: any) => i.id !== item.id);

    // Add to target
    this.columns[targetColIndex].items.push(item);
  }

  columns = [
    {
      title: 'Pending',
      color: 'text-slate-500 dark:text-slate-400',
      items: [
        {
          id: 'INV-201',
          title: 'Restock Warehouse A',
          description: 'Electronics section running low on 15 SKUs...',
          priority: 'Urgent',
          priorityClass: 'bg-red-500/20 text-red-400',
          avatars: ['https://ui-avatars.com/api/?name=A&size=20&background=3b429f&color=fff'],
          due: '2 days left',
        },
        {
          id: 'INV-198',
          title: 'Supplier Invoice Review',
          description: 'Review Q2 invoices from 3 suppliers...',
          priority: 'Medium',
          priorityClass: 'bg-blue-500/20 text-blue-400',
          avatars: ['https://ui-avatars.com/api/?name=B&size=20&background=6d74ff&color=fff'],
          due: '5 days left',
        },
      ],
    },
    {
      title: 'In Progress',
      color: 'text-primary',
      items: [
        {
          id: 'INV-195',
          title: 'Inventory Audit - Zone B',
          description: 'Physical count vs system records for Zone B...',
          priority: 'High',
          priorityClass: 'bg-amber-500/20 text-amber-400',
          avatars: [
            'https://ui-avatars.com/api/?name=C&size=20&background=3b429f&color=fff',
            'https://ui-avatars.com/api/?name=D&size=20&background=6d74ff&color=fff',
          ],
          due: 'In progress',
        },
      ],
    },
    {
      title: 'Completed',
      color: 'text-green-500',
      items: [
        {
          id: 'INV-190',
          title: 'Setup Barcode System',
          description: 'Barcode scanning integration complete...',
          priority: 'Done',
          priorityClass: 'bg-green-500/20 text-green-400',
          avatars: ['https://ui-avatars.com/api/?name=E&size=20&background=3b429f&color=fff'],
          due: 'Completed',
        },
      ],
    },
  ];
}
