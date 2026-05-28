import { isPlatformBrowser } from '@angular/common';
import { computed, effect, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { type Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type LoaderType = 'flower' | 'gravity' | 'pulse' | 'liquid' | 'pulse-slow' | 'windows' | 'bloom' | 'jitter';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly themes = ['void-blue', 'emerald', 'rose', 'obsidian', 'gold', 'glass'];
  readonly loaders: LoaderType[] = ['bloom', 'windows', 'flower', 'gravity', 'pulse', 'liquid', 'pulse-slow'];

  currentTheme = signal<string>('void-blue');
  currentLoader = signal<LoaderType>('bloom');
  loaderDuration = signal<number>(800); // Default 800ms delay
  private platformId = inject(PLATFORM_ID);

  animationSpeed = computed(() => {
    const duration = this.loaderDuration();
    if (duration === 0) return 1.4; // Instant -> Fast playback
    if (duration <= 400) return 1.2; // Quick -> Snappy
    if (duration <= 800) return 1; // Default -> Balanced
    return 0.7; // Smooth -> Elegant/Slow
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Optimistic initial load from localStorage
      const storedTheme = localStorage.getItem('color-theme');
      if (storedTheme && this.themes.includes(storedTheme)) {
        this.currentTheme.set(storedTheme);
        this.applyThemeToDOM(storedTheme);
      }

      const storedLoader = localStorage.getItem('loader-type') as LoaderType;
      if (storedLoader && this.loaders.includes(storedLoader)) {
        this.currentLoader.set(storedLoader);
      }

      const storedDuration = localStorage.getItem('loader-duration');
      if (storedDuration) {
        this.loaderDuration.set(parseInt(storedDuration, 10));
      }

      // Fetch from backend
      this.getThemeFromBackend().subscribe((data) => {
        if (data?.theme && this.themes.includes(data.theme)) {
          this.currentTheme.set(data.theme);
          this.applyThemeToDOM(data.theme);
        }
        if (data?.loader && this.loaders.includes(data.loader as LoaderType)) {
          this.currentLoader.set(data.loader as LoaderType);
        }
        if (data && data.duration !== undefined) {
          this.loaderDuration.set(data.duration);
        }
      });
    }

    // Effect to automatically sync DOM whenever signal changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const theme = this.currentTheme();
        this.applyThemeToDOM(theme);
      }
    });

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const loader = this.currentLoader();
        localStorage.setItem('loader-type', loader);
      }
    });

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const duration = this.loaderDuration();
        localStorage.setItem('loader-duration', duration.toString());
      }
    });
  }

  private applyThemeToDOM(theme: string) {
    if (theme === 'void-blue') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('color-theme', theme);
  }

  setTheme(theme: string): void {
    if (this.themes.includes(theme)) {
      this.currentTheme.set(theme);
      this.saveToBackend({ theme }).subscribe();
    }
  }

  setLoader(loader: LoaderType): void {
    if (this.loaders.includes(loader)) {
      this.currentLoader.set(loader);
      this.saveToBackend({ loader }).subscribe();
    }
  }

  setLoaderDuration(duration: number): void {
    this.loaderDuration.set(duration);
    this.saveToBackend({ duration }).subscribe();
  }

  // Simulated backend calls
  private getThemeFromBackend(): Observable<{
    theme: string;
    loader: string;
    duration: number;
  } | null> {
    const mockDbTheme = localStorage.getItem('mock-db-theme') || 'void-blue';
    const mockDbLoader = localStorage.getItem('mock-db-loader') || 'bloom';
    const mockDbDuration = parseInt(localStorage.getItem('mock-db-duration') || '800', 10);
    return of({
      theme: mockDbTheme,
      loader: mockDbLoader,
      duration: mockDbDuration,
    }).pipe(delay(500));
  }

  private saveToBackend(data: { theme?: string; loader?: string; duration?: number }): Observable<boolean> {
    if (data.theme) localStorage.setItem('mock-db-theme', data.theme);
    if (data.loader) localStorage.setItem('mock-db-loader', data.loader);
    if (data.duration !== undefined) localStorage.setItem('mock-db-duration', data.duration.toString());
    return of(true).pipe(delay(300));
  }
}
