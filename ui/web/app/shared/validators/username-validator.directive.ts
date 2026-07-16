import { HttpClient } from '@angular/common/http';
import { Directive, forwardRef, inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../environment';

@Directive({
  selector:
    '[libUsernameValidator][formControlName],[libUsernameValidator][formControl],[libUsernameValidator][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => UsernameValidatorDirective),
      multi: true,
    },
  ],
})
export class UsernameValidatorDirective implements AsyncValidator {
  private http = inject(HttpClient);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value) {
      return timer(0).pipe(map(() => null));
    }

    // Debounce backend check to reduce database and network overhead
    return timer(300).pipe(
      switchMap(() =>
        this.http
          .get<{ exists: boolean }>(
            `${environment.apiUrl}/auth/check-username?username=${encodeURIComponent(control.value)}`,
          )
          .pipe(
            map((res) => (res.exists ? { usernameTaken: true } : null)),
            catchError(() => timer(0).pipe(map(() => null))),
          ),
      ),
    );
  }
}
