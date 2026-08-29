import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Токен авторизации не передан',
      );
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Неверный формат токена авторизации',
      );
    }

    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'Переменная окружения JWT_SECRET не найдена',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Токен недействителен или истёк',
      );
    }
  }
}