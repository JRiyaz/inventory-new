import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'libValidationError',
  standalone: true,
})
export class ValidationErrorPipe implements PipeTransform {
  transform(errors: any, fieldName: string = 'Field'): string {
    if (!errors) return '';

    if (errors.required) return `${fieldName} is required.`;
    if (errors.min) return `${fieldName} must be at least ${errors.min.min}.`;
    if (errors.max) return `${fieldName} cannot exceed ${errors.max.max}.`;
    if (errors.email) return `Invalid email format.`;
    if (errors.minlength) return `${fieldName} must be at least ${errors.minlength.requiredLength} characters.`;

    return 'Invalid value.';
  }
}
