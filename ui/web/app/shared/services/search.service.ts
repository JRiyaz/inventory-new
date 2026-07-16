import { Injectable, signal } from '@angular/core';
import { forkJoin, map, type Observable, of } from 'rxjs';

export interface SearchableItem {
  id: string;
  title: string;
  path: string;
  category: string;
  queryParams?: Record<string, any>;
  keywords?: string[];
}

export interface SearchProvider {
  id: string;
  name: string;
  search: (query: string) => Observable<SearchableItem[]>;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private providers = signal<SearchProvider[]>([]);

  constructor() {
    // Initialize from global window object to ensure cross-MFE singleton behavior
    const globalProviders = (window as any).__SEARCH_PROVIDERS__ || [];
    this.providers.set(globalProviders);
    (window as any).__SEARCH_PROVIDERS__ = globalProviders;
  }

  /**
   * Register a search provider.
   * Instead of registering items, services register a function that returns items.
   */
  registerProvider(provider: SearchProvider): void {
    const currentGlobal = (window as any).__SEARCH_PROVIDERS__ || [];
    const exists = currentGlobal.find((p: any) => p.id === provider.id);

    if (!exists) {
      const updated = [...currentGlobal, provider];
      (window as any).__SEARCH_PROVIDERS__ = updated;
      this.providers.set(updated);
      console.log(`[SearchService] Registered provider: ${provider.name}`);
    }
  }

  /**
   * Unregister a search provider.
   */
  unregisterProvider(providerId: string): void {
    const currentGlobal = (window as any).__SEARCH_PROVIDERS__ || [];
    const updated = currentGlobal.filter((p: any) => p.id !== providerId);

    (window as any).__SEARCH_PROVIDERS__ = updated;
    this.providers.set(updated);
    console.log(`[SearchService] Unregistered provider: ${providerId}`);
  }

  /**
   * Perform a search across all registered providers.
   */
  search(query: string): Observable<SearchableItem[]> {
    const activeProviders = this.providers();

    if (activeProviders.length === 0 || !query.trim()) {
      return of([]);
    }

    const searchTasks = activeProviders.map((provider) =>
      provider.search(query).pipe(
        // Add error handling per provider so one failure doesn't break everything
        map((results) =>
          results.map((item) => ({
            ...item,
            category: item.category || provider.name, // Fallback to provider name if category missing
          })),
        ),
      ),
    );

    return forkJoin(searchTasks).pipe(
      map((resultsArray) => {
        // Flatten the array of results and return
        return resultsArray.reduce((acc, curr) => {
          acc.push(...curr);
          return acc;
        }, [] as SearchableItem[]);
      }),
    );
  }
}
