import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StoreStateService {
  searchQuery = signal('');
  selectedCategory = signal<string | null>(null);
  sortBy = signal('name');
  showOffersOnly = signal(false);

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  setCategory(category: string | null) {
    this.selectedCategory.set(category);
    this.showOffersOnly.set(false);
  }

  setSortBy(sort: string) {
    this.sortBy.set(sort);
  }

  setShowOffersOnly(show: boolean) {
    this.showOffersOnly.set(show);
    if (show) this.selectedCategory.set(null);
  }
}
