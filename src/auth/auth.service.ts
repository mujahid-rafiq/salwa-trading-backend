import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { Role } from '../enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check if phone number already exists
    const existingPhone = await this.usersService.findByPhoneNumber(
      registerDto.phoneNumber,
    );

    if (existingPhone) {
      throw new BadRequestException('Phone number already exists');
    }

    const referredBy = registerDto.referralCode
      ? await this.usersService.findByReferralCode(registerDto.referralCode)
      : null;

    if (registerDto.referralCode && !referredBy) {
      throw new BadRequestException('Invalid referral code');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save user with activation code
    const user = await this.usersService.create({
      ...registerDto,
      referralCode: this.usersService.generateReferralCode(),
      referredBy: referredBy ?? undefined,
      password: hashedPassword,
      role: Role.CLIENT,
      isVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    try {
      await this.mailService.sendMail(
        registerDto.email,
        'Verify your Noovacor account',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0d56b; border-radius: 12px; background: #fffdf7;">
            <h2 style="color: #b8860b;">Verify Your Email</h2>
            <p>Hi ${registerDto.fullName || 'there'},</p>
            <p>Use the OTP below to verify your email address and activate your account.</p>
            <p style="font-size: 24px; font-weight: bold; color: #333;">${verificationCode}</p>
            <p>This code is valid for 15 minutes.</p>
            <p style="margin-top: 20px;">Thanks,<br />The Noovacor Team</p>
          </div>
        `,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      message: 'User registered successfully. Please verify your email.',
      user: userWithoutPassword,
    };
  }

  async registerAdmin(registerDto: RegisterDto) {
    // Check if email already exists
    const existingEmail = await this.usersService.findByEmail(
      registerDto.email,
    );

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    // Check if phone number already exists
    const existingPhone = await this.usersService.findByPhoneNumber(
      registerDto.phoneNumber,
    );

    if (existingPhone) {
      throw new BadRequestException('Phone number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const { password, ...userWithoutPassword } = user;

    try {
      await this.mailService.sendMail(
        registerDto.email,
        'Verify your Noovacor admin account',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0d56b; border-radius: 12px; background: #fffdf7;">
            <h2 style="color: #b8860b;">Verify Your Admin Email</h2>
            <p>Hi ${registerDto.fullName || 'there'},</p>
            <p>Use the OTP below to verify your admin account.</p>
            <p style="font-size: 24px; font-weight: bold; color: #333;">${verificationCode}</p>
            <p>This code is valid for 15 minutes.</p>
            <p style="margin-top: 20px;">Thanks,<br />The Noovacor Team</p>
          </div>
        `,
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    return {
      message: 'Admin registered successfully. Please verify your email.',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    // Check if user exists
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email is not verified. Please verify your email.');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // JWT Payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate Token
    const accessToken = await this.jwtService.signAsync(payload);

    // Remove password before sending response
    const { password, ...userWithoutPassword } = user;

    return {
      message: 'Login successful',
      accessToken,
      user: userWithoutPassword,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetCode = otp;
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.save(user);

    try {
      await this.mailService.sendMail(
        user.email,
        'Noovacor Password Reset OTP',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0d56b; border-radius: 12px; background: #fffdf7;">
            <h2 style="color: #b8860b;">Password Reset OTP</h2>
            <p>Hi ${user.fullName || 'there'},</p>
            <p>Your OTP code is:</p>
            <p style="font-size: 24px; font-weight: bold; color: #333;">${otp}</p>
            <p>This code is valid for 15 minutes.</p>
            <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      );
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }

    return {
      message: 'OTP sent to your email',
      email: user.email,
    };
  }

  async activateAccount(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(verifyOtpDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      return {
        message: 'Account already verified',
      };
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationCode !== verifyOtpDto.otp
    ) {
      throw new BadRequestException('Invalid email or OTP code');
    }

    if (user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }

    user.isVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiresAt = null;
    await this.usersService.save(user);

    try {
      await this.mailService.sendMail(
        user.email,
        'Welcome to Noovacor',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0d56b; border-radius: 12px; background: #fffdf7;">
            <h2 style="color: #b8860b;">Welcome to Noovacor</h2>
            <p>Hi ${user.fullName || 'there'},</p>
            <p>Your account has been successfully verified.</p>
            <p>We're excited to have you on board.</p>
            <p style="margin-top: 20px;">Thanks,<br />The Noovacor Team</p>
          </div>
        `,
      );
    } catch (error) {
      console.error('Failed to send welcome email after verification:', error);
    }

    return {
      message: 'Account verified successfully',
    };
  }

  async resendActivationCode(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = otp;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.save(user);

    try {
      await this.mailService.sendMail(
        user.email,
        'Noovacor Email Verification OTP',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f0d56b; border-radius: 12px; background: #fffdf7;">
            <h2 style="color: #b8860b;">Email Verification OTP</h2>
            <p>Hi ${user.fullName || 'there'},</p>
            <p>Your new OTP code is:</p>
            <p style="font-size: 24px; font-weight: bold; color: #333;">${otp}</p>
            <p>This code is valid for 15 minutes.</p>
            <p style="margin-top: 20px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      );
    } catch (error) {
      console.error('Failed to send activation OTP email:', error);
    }

    return {
      message: 'Activation OTP resent to your email',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(verifyOtpDto.email);
    if (
      !user ||
      !user.passwordResetCode ||
      !user.passwordResetExpiresAt ||
      user.passwordResetCode !== verifyOtpDto.otp
    ) {
      throw new BadRequestException('Invalid email or OTP code');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }

    return {
      message: 'OTP verified successfully',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !user.passwordResetCode ||
      !user.passwordResetExpiresAt ||
      user.passwordResetCode !== resetPasswordDto.otpCode
    ) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }

    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    user.passwordResetCode = null;
    user.passwordResetExpiresAt = null;
    await this.usersService.save(user);

    return {
      message: 'Password reset successful',
    };
  }

  async getProfile(authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authorization.replace('Bearer ', '').trim();

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.usersService.findOne(payload.sub);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }

  async logout(req: any) {
    return {
      message: 'Logout successful',
      user: req?.user || null,
    };
  }
}