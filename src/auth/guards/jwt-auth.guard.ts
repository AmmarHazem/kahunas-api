import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import * as crypto from 'crypto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private encryptionKey: Uint8Array;

  constructor(private configService: ConfigService) {
    super();
    const secret = this.configService.get<string>('JWT_SECRET');
    const hash = crypto.createHash('sha256').update(secret).digest();
    this.encryptionKey = new Uint8Array(hash);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const { payload } = await jose.jwtDecrypt(token, this.encryptionKey);
      const innerToken = payload.token as string;
      request.headers.authorization = `Bearer ${innerToken}`;
      const canActivate = await super.canActivate(context);
      return canActivate as boolean;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }

  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
