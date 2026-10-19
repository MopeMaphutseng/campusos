import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const CURRENT_UNIVERSITY_ID = 'currentUniversityId';
export const CURRENT_USER_ID = 'currentUserId';
export const MODULE_KEY = 'module_key';
export const SENSITIVE_OPERATION = 'sensitive_operation';

export const UniversityId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-university-id'];
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const RequireModule = (module: string) => SetMetadata(MODULE_KEY, module);
export const SensitiveOperation = () => SetMetadata(SENSITIVE_OPERATION, true);
