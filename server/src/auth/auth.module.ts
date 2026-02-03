import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthService } from './services/oauth.service';
import { PhoneVerificationService } from './services/phone-verification.service';
import { BusinessNumberVerificationService } from './services/business-number-verification.service';
import { BusinessRegistrationOcrService } from './services/business-registration-ocr.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PhoneVerification } from './entities/phone-verification.entity';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    TypeOrmModule.forFeature([PhoneVerification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
          signOptions: {
            expiresIn: expiresIn as any,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthService,
    PhoneVerificationService,
    BusinessNumberVerificationService,
    BusinessRegistrationOcrService,
    JwtStrategy,
  ],
  exports: [AuthService, PhoneVerificationService],
})
export class AuthModule {}

