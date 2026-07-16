import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LoadingComponent,
  NotificationService,
  NotificationSidenavComponent,
  NotificationToastComponent,
} from 'ui-shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NotificationToastComponent, NotificationSidenavComponent, LoadingComponent],
  template: `
    <router-outlet />

    <!-- Global Layers -->
    <ui-loading />
    <ui-notification-toast />
    @if (notificationService.sidenavOpen()) {
      <ui-notification-sidenav
        (close)="notificationService.sidenavOpen.set(false)"
      />
    }
  `,
  styles: [],
})
export class AppComponent {
  title = 'shell';
  notificationService = inject(NotificationService);
}
