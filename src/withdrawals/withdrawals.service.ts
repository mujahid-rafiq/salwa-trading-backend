import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawDto, PaymentMethod } from './dto/create-withdraw.dto';
import { User } from '../users/entities/user.entity';
import { PackageRequestsService } from '../package-requests/package-requests.service';
import { PackageRequest } from '../package-requests/entities/package-request.entity';
import { UsersService } from '../users/users.service';
import { WithdrawalStatus } from '../enums/withdrawal-status.enum';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    private readonly packageRequestsService: PackageRequestsService,
    private readonly usersService: UsersService,
  ) {}

  async createWithdrawal(user: User, dto: CreateWithdrawDto) {
    const paymentDetails = {
      paymentMethod: dto.paymentMethod,
      bankName: dto.bankName,
      iban: dto.iban,
      accountTitle: dto.accountTitle,
      mobileNumber: dto.mobileNumber,
    };

    const w = this.withdrawalRepository.create({
      user,
      amount: dto.amount,
      source: dto.source,
      paymentMethod: dto.paymentMethod,
      bankName: dto.bankName,
      iban: dto.iban,
      accountTitle: dto.accountTitle,
      mobileNumber: dto.mobileNumber,
      notes: dto.notes ?? this.buildPaymentNotes(dto),
      status: WithdrawalStatus.PENDING,
    });

    return await this.withdrawalRepository.save(w);
  }

  private buildPaymentNotes(dto: CreateWithdrawDto) {
    const details: string[] = [];

    if (dto.paymentMethod === PaymentMethod.BANK_TRANSFER) {
      if (dto.bankName) details.push(`Bank Name: ${dto.bankName}`);
      if (dto.iban) details.push(`IBAN: ${dto.iban}`);
    }

    if (
      dto.paymentMethod === PaymentMethod.EASY_PAISA ||
      dto.paymentMethod === PaymentMethod.JAZZ_CASH ||
      dto.paymentMethod === PaymentMethod.USDT
    ) {
      if (dto.accountTitle) details.push(`Account Title: ${dto.accountTitle}`);
      if (dto.mobileNumber) details.push(`Mobile Number: ${dto.mobileNumber}`);
    }

    return details.length ? details.join(' | ') : dto.notes || 'Withdrawal request';
  }

  async findByUser(user: User) {
    return await this.withdrawalRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingWithdrawals() {
    return await this.withdrawalRepository.find({
      where: { status: WithdrawalStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAdminDashboard() {
    const pendingCount = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.PENDING },
    });
    const approvedCount = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.COMPLETED },
    });
    const rejectedCount = await this.withdrawalRepository.count({
      where: { status: WithdrawalStatus.REJECTED },
    });
    const totalCount = await this.withdrawalRepository.count();

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
    };
  }

  async approveWithdrawal(id: number, adminUser: User) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be approved');
    }

    withdrawal.status = WithdrawalStatus.COMPLETED;
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = adminUser.email;

    return await this.withdrawalRepository.save(withdrawal);
  }

  async rejectWithdrawal(id: number, adminUser: User, reason?: string) {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: { id },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be rejected');
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.reviewedAt = new Date();
    withdrawal.reviewedBy = adminUser.email;
    withdrawal.notes = reason ? `${withdrawal.notes || ''} Rejection reason: ${reason}` : withdrawal.notes;

    return await this.withdrawalRepository.save(withdrawal);
  }

  // Compute balances from approved package requests.
  async getBalances(user: User) {
    try {
      const requests: PackageRequest[] = await this.packageRequestsService.findByUser(user);
      const now = new Date();
      let earnings = 0;

      for (const r of requests) {
        if (r.status !== 'Approved') continue;

        const reviewedAt = r.reviewedAt ?? r.createdAt;
        if (!reviewedAt) continue;

        const rateMatch = String(r.profitRate).match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
        const dailyRate = rateMatch ? Number(rateMatch[1]) : 0;

        const durMatch = String(r.duration).match(/([0-9]+)\s*/);
        const durationDays = durMatch ? Number(durMatch[1]) : 0;

        const ms = Math.max(0, now.getTime() - new Date(reviewedAt).getTime());
        const elapsedDays = Math.floor(ms / (1000 * 60 * 60 * 24));
        const applicableDays = durationDays > 0 ? Math.min(elapsedDays, durationDays) : elapsedDays;

        const accrued = Number(r.amount) * (dailyRate / 100) * applicableDays;
        earnings += accrued;
      }

      // compute referral bonus: 5% of earnings generated by referred users
      let totalRefEarnings = 0;
      try {
        const referredUsers = await this.usersService.findByReferrer(user.id);
        for (const refUser of referredUsers) {
          const refRequests = await this.packageRequestsService.findByUser(refUser);
          let refEarnings = 0;
          for (const r of refRequests) {
            if (r.status !== 'Approved') continue;
            const reviewedAt = r.reviewedAt ?? r.createdAt;
            if (!reviewedAt) continue;
            const rateMatch = String(r.profitRate).match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
            const dailyRate = rateMatch ? Number(rateMatch[1]) : 0;
            const durMatch = String(r.duration).match(/([0-9]+)\s*/);
            const durationDays = durMatch ? Number(durMatch[1]) : 0;
            const ms = Math.max(0, now.getTime() - new Date(reviewedAt).getTime());
            const elapsedDays = Math.floor(ms / (1000 * 60 * 60 * 24));
            const applicableDays = durationDays > 0 ? Math.min(elapsedDays, durationDays) : elapsedDays;
            refEarnings += Number(r.amount) * (dailyRate / 100) * applicableDays;
          }
          totalRefEarnings += refEarnings;
        }
      } catch (err) {
        totalRefEarnings = 0;
      }

      const bonus = Number((totalRefEarnings * 0.05).toFixed(2));

      return {
        earnings: Number(earnings.toFixed(2)),
        bonus,
      };
    } catch (err) {
      return { earnings: 0, bonus: 0 };
    }
  }
}
