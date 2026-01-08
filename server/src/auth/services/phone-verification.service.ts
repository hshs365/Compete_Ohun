import { Injectable, BadRequestException, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PhoneVerification } from '../entities/phone-verification.entity';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class PhoneVerificationService {
  private readonly CODE_EXPIRY_MINUTES = 5; // 인증번호 유효 시간 (5분)
  private readonly MAX_ATTEMPTS = 5; // 최대 인증 시도 횟수
  private readonly MAX_REQUESTS_PER_HOUR = 3; // 시간당 최대 발송 횟수

  constructor(
    @InjectRepository(PhoneVerification)
    private verificationRepository: Repository<PhoneVerification>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  /**
   * 전화번호 형식 검증
   */
  private validatePhoneFormat(phone: string): boolean {
    // 한국 전화번호 형식: 010-1234-5678 또는 01012345678
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 전화번호 정규화 (하이픈 제거)
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/-/g, '');
  }

  /**
   * 6자리 인증번호 생성
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * 인증번호 발송 (SMS)
   * 실제 운영 시에는 SMS 발송 서비스(예: 알리고, 카카오 알림톡 등)를 연동해야 합니다.
   */
  private async sendSMS(phone: string, code: string): Promise<void> {
    // TODO: 실제 SMS 발송 서비스 연동
    // 예: 알리고, 카카오 알림톡, 네이버 클라우드 플랫폼 등
    
    // 개발 환경에서는 콘솔에 출력
    console.log(`[SMS 발송] ${phone}로 인증번호 ${code}를 발송했습니다.`);
    console.log(`[개발 모드] 실제 운영 시에는 SMS 발송 서비스를 연동해야 합니다.`);
    
    // 실제 SMS 발송 예시 (주석 처리)
    // const smsService = new SMSService();
    // await smsService.send({
    //   to: phone,
    //   message: `[오운] 인증번호는 ${code}입니다. 5분 내에 입력해주세요.`,
    // });
  }

  /**
   * 인증번호 발송 요청
   */
  async requestVerification(phone: string): Promise<{ success: boolean; message: string }> {
    // 전화번호 형식 검증
    if (!this.validatePhoneFormat(phone)) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
    }

    const normalizedPhone = this.normalizePhone(phone);

    // 전화번호 중복 확인 (활성 사용자만 확인, 탈퇴한 사용자의 전화번호는 재사용 가능)
    const existingUser = await this.usersService.findByPhone(normalizedPhone);
    if (existingUser && existingUser.status === UserStatus.ACTIVE) {
      throw new BadRequestException('이미 가입된 휴대폰 번호입니다.');
    }

    // 최근 1시간 내 발송 횟수 확인
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCount = await this.verificationRepository.count({
      where: {
        phone: normalizedPhone,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentCount >= this.MAX_REQUESTS_PER_HOUR) {
      throw new HttpException(
        '1시간에 최대 3회까지 인증번호를 요청할 수 있습니다.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 기존 미인증 코드 삭제 (같은 전화번호)
    await this.verificationRepository.delete({
      phone: normalizedPhone,
      verified: false,
    });

    // 새 인증번호 생성
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    const verification = this.verificationRepository.create({
      phone: normalizedPhone,
      code,
      verified: false,
      attemptCount: 0,
      expiresAt,
    });

    await this.verificationRepository.save(verification);

    // SMS 발송
    await this.sendSMS(phone, code);

    return {
      success: true,
      message: '인증번호가 발송되었습니다.',
    };
  }

  /**
   * 인증번호 검증
   */
  async verifyCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!this.validatePhoneFormat(phone)) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
    }

    const normalizedPhone = this.normalizePhone(phone);

    // 가장 최근 인증번호 조회
    const verification = await this.verificationRepository.findOne({
      where: { phone: normalizedPhone, verified: false },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      throw new BadRequestException('인증번호를 먼저 요청해주세요.');
    }

    // 만료 시간 확인
    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('인증번호가 만료되었습니다. 다시 요청해주세요.');
    }

    // 시도 횟수 확인
    if (verification.attemptCount >= this.MAX_ATTEMPTS) {
      throw new BadRequestException('인증 시도 횟수를 초과했습니다. 다시 요청해주세요.');
    }

    // 인증번호 확인
    if (verification.code !== code) {
      verification.attemptCount += 1;
      await this.verificationRepository.save(verification);

      const remainingAttempts = this.MAX_ATTEMPTS - verification.attemptCount;
      throw new BadRequestException(
        `인증번호가 일치하지 않습니다. (남은 시도 횟수: ${remainingAttempts}회)`,
      );
    }

    // 인증 완료 처리
    verification.verified = true;
    await this.verificationRepository.save(verification);

    return {
      success: true,
      message: '인증이 완료되었습니다.',
    };
  }

  /**
   * 전화번호 인증 완료 여부 확인
   */
  async isVerified(phone: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone);
    const verification = await this.verificationRepository.findOne({
      where: { phone: normalizedPhone, verified: true },
      order: { createdAt: 'DESC' },
    });

    if (!verification) {
      return false;
    }

    // 인증 완료 후 24시간 이내인지 확인 (선택사항)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return verification.createdAt > twentyFourHoursAgo;
  }
}
