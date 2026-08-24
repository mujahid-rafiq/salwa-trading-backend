import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';

import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(registerDto: DeepPartial<User>): Promise<User> {
    const user = this.userRepository.create(registerDto);
    return await this.userRepository.save(user);
  }

  generateReferralCode(): string {
    return `SALWA${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { phoneNumber },
    });
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { referralCode: referralCode.trim().toUpperCase() },
    });
  }

  async getReferralDetails(user: User) {
    if (!user.referralCode) {
      user.referralCode = this.generateReferralCode();
      await this.save(user);
    }

    const directReferrals = await this.findByReferrer(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    return {
      referralCode: user.referralCode,
      referralLink: `${frontendUrl}/signup?referralCode=${user.referralCode}`,
      directReferrals: directReferrals.map((referral) => ({
        id: referral.id,
        fullName: referral.fullName,
        email: referral.email,
        createdAt: referral.createdAt,
      })),
    };
  }

  async findByReferrer(referrerId: number): Promise<User[]> {
    return await this.userRepository.find({
      where: { referredBy: { id: referrerId } },
    });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }
}