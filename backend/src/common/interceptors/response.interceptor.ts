import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (response && response.data !== undefined) {
          return response;
        }
        if (response && response.accessToken !== undefined) {
          return { data: response };
        }
        if (response && response.meta !== undefined) {
          return response;
        }
        if (response && Array.isArray(response)) {
          return response;
        }
        return { data: response };
      }),
    );
  }
}
