import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'data' in data) {
          return {
            ...data,
            meta: {
              ...data.meta,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'items' in response) {
          return {
            data: response.items,
            meta: {
              total: response.total,
              page: response.page || 1,
              limit: response.limit || 20,
              totalPages: Math.ceil(response.total / (response.limit || 20)),
            },
          };
        }
        return response;
      }),
    );
  }
}
