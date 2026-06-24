import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AppException } from '../../exceptions/app.exception';
import { ErrorCodes } from '../../exceptions/error-codes';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user || {};
    const role = String(user.role || '').toLowerCase();

    const isAdmin =
      role === 'admin' ||
      role === 'master' ||
      user.is_admin === true ||
      user.isAdmin === true ||
      user.is_master === true ||
      user.isMaster === true;

    if (isAdmin) {
      return true;
    }

    throw new AppException(
      ErrorCodes.AUTH_FORBIDDEN,
      'Admin permission is required.',
      HttpStatus.FORBIDDEN,
    );
  }
}
