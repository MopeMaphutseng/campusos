import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Allows only users whose JWT role is `admin` or `super_admin`.
 * Must run after AuthGuard('jwt') so req.user is populated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = req?.user?.role;
    if (role === 'admin' || role === 'super_admin') return true;
    throw new ForbiddenException('Administrator access required');
  }
}
