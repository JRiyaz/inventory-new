import { isPlatformBrowser } from '@angular/common';
import { effect, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  isDarkMode = signal(false);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('theme');
      // Default to dark if no setting exists, or check system preference
      const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
      this.isDarkMode.set(isDark);
      this.applyTheme(isDark);
    }

    effect(() => {
      const isDark = this.isDarkMode();
      if (isPlatformBrowser(this.platformId)) {
        this.applyTheme(isDark);
      }
    });
  }

  toggle() {
    this.isDarkMode.update((v) => !v);
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
