import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from './roles.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('register-admin')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin registered successfully',
  })
  registerAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.registerAdmin(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login User' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent to email',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('activate-account')
  @ApiOperation({ summary: 'Activate account using email OTP' })
  @ApiResponse({
    status: 200,
    description: 'Account activated successfully',
  })
  activateAccount(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.activateAccount(verifyOtpDto);
  }

  @Post('resend-activation-code')
  @ApiOperation({ summary: 'Resend account activation OTP' })
  @ApiResponse({
    status: 200,
    description: 'Activation OTP resent',
  })
  resendActivationCode(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.resendActivationCode(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  getProfile(@Req() req: any) {
    return { user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin-dashboard')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Admin dashboard retrieved successfully',
  })
  adminDashboard(@Req() req: any) {
    return {
      message: 'Admin dashboard access granted',
      user: req.user,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout User' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  logout(@Req() req: any) {
    return this.authService.logout(req);
  }
}