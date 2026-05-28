import {
  type HttpErrorResponse,
  type HttpEvent,
  type HttpHandler,
  type HttpInterceptor,
  type HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { type Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

@Injectable()
export class AuthCsrfInterceptor implements HttpInterceptor {
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let clonedReq = req;

    // 1. Collect CSRF token from cookie and add to request headers for modifying actions (POST, PUT, DELETE)
    const csrfToken = getCookie('csrftoken') || getCookie('XSRF-TOKEN');
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      clonedReq = req.clone({
        headers: req.headers.set('X-CSRF-Token', csrfToken).set('X-XSRF-TOKEN', csrfToken),
      });
    }

    // 2. Intercept response to catch 401 Unauthorized errors and redirect to login page
    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.warn('[HTTP Interceptor] 401 Unauthorized detected. Redirecting to login...');
          this.router.navigate(['/user/login']);
        }
        return throwError(() => error);
      }),
    );
  }
}
