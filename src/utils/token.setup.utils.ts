import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/models/user.schema';

export const createToken = (
  user: User,
  configService: ConfigService,
  jwtService: JwtService,
): string => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  return jwtService.sign(payload, {
    secret: configService.get('JWT_SECRET'),
    expiresIn: '7d',
  });
};
