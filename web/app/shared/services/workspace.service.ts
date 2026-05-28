import { Injectable, signal } from '@angular/core';

export interface SubProject {
  name: string;
  status: 'running' | 'offline' | 'error';
  port?: number;
  services?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  subProjects = signal<SubProject[]>([
    {
      name: 'Inventory Monolith',
      status: 'running',
      port: 3000,
      services: ['Dashboard Layout', 'User Auth', 'Monolithic Monolith'],
    },
    {
      name: 'Products & Catalog',
      status: 'running',
      services: ['Product Management', 'SKU Validations'],
    },
    {
      name: 'Warehouses & Space',
      status: 'running',
      services: ['Capacity Monitor', 'Zones Layout'],
    },
    {
      name: 'Customer & Billing Profiles',
      status: 'running',
      services: ['Directory Directory', 'Invoicing'],
    },
    {
      name: 'Procurement (POs)',
      status: 'running',
      services: ['Replenishment Drafts', 'Stock Arrival Auditing'],
    },
    {
      name: 'Orders & Payments',
      status: 'running',
      services: ['Storefront Checkout', 'Transactions Ledger'],
    },
    {
      name: 'Live Chat Support',
      status: 'running',
      services: ['WebSocket Messenger', 'Agent Panel'],
    },
  ]);
  selectedProjectIndex = signal(0);

  getSelectedProject(): SubProject | undefined {
    return this.subProjects()[this.selectedProjectIndex()];
  }

  selectProject(index: number): void {
    this.selectedProjectIndex.set(index);
  }
}
