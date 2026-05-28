import { isPlatformBrowser } from '@angular/common';
import { effect, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DisplayImageService {
  displayImage = signal<boolean>(true);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('display-image');
      if (stored !== null) {
        this.displayImage.set(stored === 'true');
      }
    }

    // Effect to automatically sync to localStorage whenever signal changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('display-image', String(this.displayImage()));
      }
    });
  }

  setDisplayImage(value: boolean): void {
    this.displayImage.set(value);
  }

  toggleDisplayImage(): void {
    this.displayImage.update((v) => !v);
  }
}
