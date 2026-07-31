import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization =
      request.headers?.authorization || request.headers?.Authorization;

    if (!authorization || typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authorization.replace('Bearer ', '').trim();

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersService.findOne(payload.sub);
    request.user = user;

    return true;
  }
}
