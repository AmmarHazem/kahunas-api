import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jose from 'jose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private encryptionKey: Uint8Array;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
    const secret = this.configService.get<string>('JWT_SECRET');
    this.encryptionKey = new TextEncoder().encode(secret);
  }

  async validate(req: Request) {
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (!token) {
        throw new UnauthorizedException();
      }
      const { payload: decrypted } = await jose.jwtDecrypt(
        token,
        this.encryptionKey,
      );
      const innerPayload = await this.verifyToken(decrypted.token as string);
      return {
        id: innerPayload.sub,
        email: innerPayload.email,
        role: innerPayload.role,
      };
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
