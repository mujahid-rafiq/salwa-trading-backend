import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawDto, PaymentMethod, WithdrawSource } from './dto/create-withdraw.dto';
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
    const balance = await this.getBalances(user);
    const availableBalance =
      dto.source === WithdrawSource.EARNINGS
        ? balance.earnings
        : dto.source === WithdrawSource.BONUS
          ? balance.bonus
          : balance.total;

    if (dto.amount < 20) {
      throw new BadRequestException('Minimum withdrawal amount is $20.');
    }

    if (dto.amount > availableBalance) {
      throw new BadRequestException(`Withdrawal amount exceeds your available ${dto.source} balance.`);
    }

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
      const profitRate = 0.08;
      const profitPeriodDays = 30;
      let earnings = 0;

      for (const r of requests) {
        if (r.status !== 'Approved') continue;

        const reviewedAt = r.reviewedAt ?? r.createdAt;
        if (!reviewedAt) continue;

        const ms = Math.max(0, now.getTime() - new Date(reviewedAt).getTime());
        const elapsedDays = Math.floor(ms / (1000 * 60 * 60 * 24));
        const applicableDays = Math.min(elapsedDays, profitPeriodDays);

        const dailyProfit = (Number(r.amount) * profitRate) / profitPeriodDays;
        const accrued = dailyProfit * applicableDays;
        earnings += accrued;
      }

      // Direct sponsors receive 8% once per approved package purchase.
      // Team commissions are based on each downline member's daily profit.
      let bonus = 0;
      try {
        const ownRequests = await this.packageRequestsService.findByUser(user);
        const hasActivePackage = ownRequests.some(
          (request) => request.status === 'Approved',
        );

        if (hasActivePackage) {
          const levelRates = [0.02, 0.02, 0.01, 0.01, 0.01];
          let levelMembers = await this.usersService.findByReferrer(user.id);

          for (let level = 0; level < levelRates.length; level += 1) {
            for (const member of levelMembers) {
              const memberRequests = await this.packageRequestsService.findByUser(member);
              for (const request of memberRequests) {
                if (request.status !== 'Approved') continue;

                if (level === 0) {
                  bonus += Number(request.amount) * 0.08;
                }

                const reviewedAt = request.reviewedAt ?? request.createdAt;
                if (!reviewedAt) continue;
                const ms = Math.max(0, now.getTime() - new Date(reviewedAt).getTime());
                const elapsedDays = Math.min(
                  Math.floor(ms / (1000 * 60 * 60 * 24)),
                  profitPeriodDays,
                );
                const dailyProfit = (Number(request.amount) * profitRate) / profitPeriodDays;
                bonus += dailyProfit * elapsedDays * levelRates[level];
              }
            }

            const nextLevelMembers: User[] = [];
            for (const member of levelMembers) {
              nextLevelMembers.push(...(await this.usersService.findByReferrer(member.id)));
            }
            levelMembers = nextLevelMembers;
          }
        }
      } catch (err) {
        bonus = 0;
      }

      const pendingAndApprovedWithdrawals = await this.withdrawalRepository.find({
        where: {
          user: { id: user.id },
          status: In([WithdrawalStatus.PENDING, WithdrawalStatus.COMPLETED]),
        },
      });

      const lockedEarnings = pendingAndApprovedWithdrawals
        .filter((withdrawal) => withdrawal.source === 'earnings')
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

      const lockedBonus = pendingAndApprovedWithdrawals
        .filter((withdrawal) => withdrawal.source === 'bonus')
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

      const lockedCombined = pendingAndApprovedWithdrawals
        .filter((withdrawal) => withdrawal.source === 'combined')
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

      const total = Math.max(0, earnings + bonus - lockedEarnings - lockedBonus - lockedCombined);

      return {
        earnings: Number(Math.max(0, earnings - lockedEarnings).toFixed(2)),
        bonus: Number(Math.max(0, bonus - lockedBonus).toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    } catch (err) {
      return { earnings: 0, bonus: 0, total: 0 };
    }
  }
}
