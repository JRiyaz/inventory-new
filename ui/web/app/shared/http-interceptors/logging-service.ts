import { type HttpHandler, type HttpInterceptor, type HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';

@Injectable()
export class LoggingService implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const started = Date.now();
    let ok: string;

    // extend server response observable with logging
    return next.handle(req).pipe(
      tap({
        next: (event) => (ok = event instanceof HttpResponse ? 'succeeded' : ''),
        error: (_error) => (ok = 'failed'),
      }),
      // Log when response observable either completes or errors
      finalize(() => {
        const elapsed = Date.now() - started;
        const msg = `${req.method} "${req.urlWithParams}" \n\t\t\t${ok} in ${elapsed} ms.`;
        console.log(msg);
      }),
    );
  }
}
