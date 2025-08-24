import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt_interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });

       // console.log('[JwtStrategy] Initialized with secret:', configService.get('JWT_SECRET'));

  }

  async validate(payload: JwtPayload) {
      //console.log('JWT Payload:', payload);

    return { userId: payload.userId, email: payload.email, role: payload.role };
  }
}
