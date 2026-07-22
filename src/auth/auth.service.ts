import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Save user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    // Check if user exists
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
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
}