import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MODULE_KEY, SENSITIVE_OPERATION, CURRENT_UNIVERSITY_ID } from '../decorators/auth.decorators';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const universityId = request.headers['x-university-id'];

    if (!universityId) {
      throw new UnauthorizedException('University ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(universityId)) {
      throw new UnauthorizedException('Invalid University ID format');
    }

    // Bind the tenant header to the authenticated principal. Authenticated users
    // may only act within their own university; the header can never widen access.
    const user = request.user;
    if (user && !user.isSuperAdmin && user.universityId && user.universityId !== universityId) {
      throw new ForbiddenException('University ID does not match authenticated user');
    }

    request[CURRENT_UNIVERSITY_ID] = universityId;
    return true;
  }
}

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>(MODULE_KEY, context.getHandler());
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const universityId = request.headers['x-university-id'];
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isSuperAdmin) return true;

    if (!user.enabledModules?.includes(requiredModule)) {
      throw new ForbiddenException(`Module '${requiredModule}' is not enabled for this university`);
    }

    return true;
  }
}

@Injectable()
export class SensitiveOperationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isSensitive = this.reflector.get<boolean>(SENSITIVE_OPERATION, context.getHandler());
    if (!isSensitive) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new UnauthorizedException();

    if (user.sensitiveOperationCooldownUntil) {
      const cooldownEnd = new Date(user.sensitiveOperationCooldownUntil);
      if (cooldownEnd > new Date()) {
        throw new ForbiddenException('Sensitive operation cooldown in effect');
      }
    }

    return true;
  }
}
