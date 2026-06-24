import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isSuccessResponse } from '../response/response-format';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId;

    return next.handle().pipe(
      map((data) => {
        if (isSuccessResponse(data)) {
          return {
            ...data,
            requestId: data.requestId ?? requestId,
          };
        }

        return {
          success: true,
          requestId,
          data,
        };
      }),
    );
  }
}
