import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'lib-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [ngClass]="statusClasses()"
      class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-1.5 w-fit"
    >
      @if (isProcessing()) {
        <div class="dots-wave">
          <span></span>
          <span></span>
          <span></span>
        </div>
      } @else {
        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClasses()"></span>
      }
      {{ status() }}
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  status = input.required<string>();

  statusClasses = computed(() => {
    const s = (this.status() || '').toLowerCase();
    if (
      ['completed', 'active', 'shipped', 'delivered', 'received', 'optimal stock', 'in stock', 'low risk'].includes(s)
    ) {
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
    if (['pending', 'processing', 'ordered', 'draft', 'medium risk'].includes(s)) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    if (['cancelled', 'failed', 'inactive', 'out of stock', 'low stock', 'high risk'].includes(s)) {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  });

  dotClasses = computed(() => {
    const s = (this.status() || '').toLowerCase();
    if (
      ['completed', 'active', 'shipped', 'delivered', 'received', 'optimal stock', 'in stock', 'low risk'].includes(s)
    ) {
      return 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]';
    }
    if (['pending', 'processing', 'ordered', 'draft', 'medium risk'].includes(s)) {
      return 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]';
    }
    if (['cancelled', 'failed', 'inactive', 'out of stock', 'low stock', 'high risk'].includes(s)) {
      return 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]';
    }
    return 'bg-slate-500';
  });

  isProcessing = computed(() => {
    const s = (this.status() || '').toLowerCase();
    return [
      'pending',
      'processing',
      'ordered',
      'shipping',
      'packaging',
      'verifying',
      'calculating',
      'allocating',
      'syncing',
      'in progress',
    ].includes(s);
  });
}
