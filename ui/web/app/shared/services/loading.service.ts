import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  isLoading = signal(false);
  loadingText = signal('Preparing your dashboard...');

  show(text: string = 'Preparing your dashboard...') {
    this.loadingText.set(text);
    this.isLoading.set(true);
  }

  hide() {
    this.isLoading.set(false);
  }

  /**
   * Simulates a loading process with a delay.
   * @param durationMs Duration of the loading in milliseconds.
   * @param text Text to display while loading.
   */
  simulateLoading(durationMs: number = 3000, text: string = 'Initializing services...') {
    this.show(text);
    setTimeout(() => {
      this.hide();
    }, durationMs);
  }
}
