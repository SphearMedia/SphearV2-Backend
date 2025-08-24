import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // console.log('[JwtAuthGuard] err:', err);
    // console.log('[JwtAuthGuard] user:', user);
    // console.log('[JwtAuthGuard] info:', info);

    // Optionally throw custom error or fallback
    return super.handleRequest(err, user, info, context);
  }
}
