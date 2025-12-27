import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Public 엔드포인트여도 토큰이 있으면 검증하고 사용자 정보 설정
      // 토큰이 없어도 에러를 던지지 않음
      const result = super.canActivate(context);
      if (result instanceof Promise) {
        return result.catch(() => true);
      }
      return result;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Public 엔드포인트에서는 토큰이 없어도 에러를 던지지 않음
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic && (err || !user)) {
      return null; // 사용자 정보가 없어도 계속 진행
    }

    // 일반 엔드포인트는 기존 동작 유지
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }
    return user;
  }
}


