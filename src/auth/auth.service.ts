import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AnalyticsService } from 'src/analytics/analytics.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as jose from 'jose';

@Injectable()
export class AuthService {
  private encryptionKey: Uint8Array;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    const hash = crypto.createHash('sha256').update(secret).digest();
    this.encryptionKey = new Uint8Array(hash);
  }

  async register(registerDto: RegisterDto) {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const { user } = await this.usersService.create(
        {
          ...registerDto,
          password: hashedPassword,
        },
        registerDto.role === UserRole.COACH ? UserRole.COACH : UserRole.CLIENT,
      );
      const token = await this.generateToken(user);
      const [createdUser] = await Promise.all([
        this.usersRepository.findOne({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        }),
        registerDto.role === UserRole.COACH
          ? this.analyticsService.handleCoachCreated({
              coachId: user.id,
            })
          : Promise.resolve(null),
      ]);
      return { user: createdUser, token };
    } catch (e) {
      console.log('--- register error ---', e);
      throw e;
    }
  }

  async login(loginDto: LoginDto) {
    const { user } = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const loginUser = await this.usersRepository.findOne({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
    const token = await this.generateToken(user);
    return { user: loginUser, token };
  }

  private async generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const jwt = await this.jwtService.signAsync(payload);
    const jwe = await new jose.EncryptJWT({ token: jwt })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .encrypt(this.encryptionKey);
    return jwe;
  }
}
