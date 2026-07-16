import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FaviconService {
  private document = inject(DOCUMENT);

  setFavicon(url: string) {
    const link: HTMLLinkElement | null = this.document.querySelector("link[rel*='icon']");
    if (!link) {
      const newLink = this.document.createElement('link');
      newLink.rel = 'icon';
      this.document.getElementsByTagName('head')[0].appendChild(newLink);
      newLink.type = 'image/png';
      newLink.href = url;
    } else {
      link.type = 'image/png';
      link.href = url;
    }
  }
}
