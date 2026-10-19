import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TargetingService } from './targeting.service';
import { TARGETED_TYPE_KEY } from './targeted-type.decorator';

/**
 * Post-filters list responses on routes annotated with @TargetedType(...).
 * Works regardless of interceptor ordering by detecting whether the payload
 * is a bare array or wrapped ({ data: [...] } / { items: [...] }).
 */
@Injectable()
export class TargetingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly targeting: TargetingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = this.reflector.getAllAndOverride<string>(TARGETED_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!type) return next.handle();

    const req = context.switchToHttp().getRequest();
    const universityId: string =
      req?.user?.universityId || req?.headers?.['x-university-id'] || req?.universityId;
    const userId: string = req?.user?.id || req?.user?.userId;

    return next.handle().pipe(
      mergeMap(async (payload) => {
        if (!universityId || !userId) return payload;
        const codes = await this.targeting.getStudentCourseCodes(universityId, userId);

        const filterArraysIn = async (obj: any): Promise<boolean> => {
          for (const key of ['data', 'items', 'results']) {
            if (Array.isArray(obj?.[key])) {
              obj[key] = await this.targeting.filterVisible(obj[key], universityId, type, codes);
              return true;
            }
          }
          return false;
        };

        if (Array.isArray(payload)) {
          return this.targeting.filterVisible(payload, universityId, type, codes);
        }
        if (payload && typeof payload === 'object') {
          if (await filterArraysIn(payload)) return payload;
          for (const key of ['data', 'items', 'results']) {
            const child = (payload as any)[key];
            if (child && typeof child === 'object' && !Array.isArray(child)) {
              if (await filterArraysIn(child)) return payload;
            }
          }
        }
        return payload;
      }),
    );
  }
}
