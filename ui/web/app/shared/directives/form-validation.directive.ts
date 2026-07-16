import { Directive, ElementRef, Input, inject, type OnChanges, type SimpleChanges } from '@angular/core';

@Directive({
  selector: '[libFormValidation]',
  standalone: true,
})
export class FormValidationDirective implements OnChanges {
  private el = inject(ElementRef);

  @Input('libFormValidation') isValid: boolean | string | null = true;
  @Input() errorMessage: string = '';

  ngOnChanges(_changes: SimpleChanges): void {
    const element = this.el.nativeElement;

    if (this.isValid === false) {
      element.classList.add('border-rose-500', 'focus:ring-rose-500/20');
      element.classList.remove('border-slate-200', 'dark:border-white/10');
    } else {
      element.classList.remove('border-rose-500', 'focus:ring-rose-500/20');
      element.classList.add('border-slate-200', 'dark:border-white/10');
    }
  }
}
