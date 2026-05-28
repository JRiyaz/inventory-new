import { Directive, effect, Input, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';

@Directive({
  selector: '[libHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private auth = inject(AuthStateService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  private requiredPermissions: string[] = [];
  private hasView = false;

  @Input() set libHasPermission(val: string[] | string) {
    this.requiredPermissions = Array.isArray(val) ? val : [val];
    this.updateView();
  }

  constructor() {
    // Keep template state in sync reactively with active Auth permissions signals
    effect(() => {
      const _perms = this.auth.permissions();
      this.updateView();
    });
  }

  private updateView() {
    const userPerms = this.auth.permissions();

    // Evaluate if the user satisfies all of the requested permission keys
    const hasAll = this.requiredPermissions.every((p) => (userPerms as any)[p] === true);

    if (hasAll && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAll && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
