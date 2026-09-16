import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PackageRequest } from './entities/package-request.entity';
import { CreatePackageRequestDto } from './dto/create-package-request.dto';
import { PackageRequestStatus } from '../enums/package-request-status.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PackageRequestType } from '../enums/package-request-type.enum';

@Injectable()
export class PackageRequestsService {
  constructor(
    @InjectRepository(PackageRequest)
    private readonly packageRequestRepository: Repository<PackageRequest>,
    private readonly usersService: UsersService,
  ) {}

  async createRequest(user: User, createDto: CreatePackageRequestDto): Promise<PackageRequest> {
    const request = this.packageRequestRepository.create({
      user,
      packageName: createDto.packageName,
      requestType: PackageRequestType.INVESTMENT,
      amount: createDto.amount,
      paymentMethod: createDto.paymentMethod,
      profitRate: createDto.profitRate,
      duration: createDto.duration,
      transactionId: createDto.transactionId,
      paymentScreenshotUrl: createDto.paymentScreenshotUrl,
      notes: createDto.notes,
    });

    return await this.packageRequestRepository.save(request);
  }

  async findByUser(user: User): Promise<PackageRequest[]> {
    return await this.packageRequestRepository.find({
      where: {
        user: {
          id: user.id,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createRegistrationRequest(user: User, createDto: CreatePackageRequestDto): Promise<PackageRequest> {
    const existingRequest = await this.packageRequestRepository.findOne({
      where: {
        user: { id: user.id },
        requestType: PackageRequestType.REGISTRATION,
        status: PackageRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a registration request pending review');
    }

    if (user.registrationApproved) {
      throw new BadRequestException('Your account registration is already approved');
    }

    const request = this.packageRequestRepository.create({
      user,
      requestType: PackageRequestType.REGISTRATION,
      packageName: 'Account Registration',
      amount: 10,
      paymentMethod: createDto.paymentMethod,
      profitRate: '0%',
      duration: 'Account access',
      transactionId: createDto.transactionId,
      paymentScreenshotUrl: createDto.paymentScreenshotUrl,
      notes: createDto.notes,
    });

    return await this.packageRequestRepository.save(request);
  }

  async getProfitHistory(user: User) {
    const requests = await this.findByUser(user);
    const now = new Date();
    const profitRate = 0.08;
    const profitPeriodDays = 30;
    const dayInMilliseconds = 1000 * 60 * 60 * 24;

    const history = requests
      .filter(
        (request) =>
          request.status === PackageRequestStatus.APPROVED &&
          request.requestType === PackageRequestType.INVESTMENT,
      )
      .flatMap((request) => {
        const receivedAt = request.reviewedAt ?? request.createdAt;
        const elapsedDays = Math.min(
          Math.floor(Math.max(0, now.getTime() - new Date(receivedAt).getTime()) / dayInMilliseconds),
          profitPeriodDays,
        );
        const dailyProfit = (Number(request.amount) * profitRate) / profitPeriodDays;

        return Array.from({ length: elapsedDays }, (_, index) => ({
          id: `${request.id}-${index + 1}`,
          receivedAt: new Date(new Date(receivedAt).getTime() + (index + 1) * dayInMilliseconds),
          source: request.packageName || 'Online USDT Deposit',
          paymentMethod: request.paymentMethod || 'Online USDT Deposit',
          depositAmount: Number(request.amount),
          profitAmount: Number(dailyProfit.toFixed(2)),
        }));
      })
      .sort((first, second) => second.receivedAt.getTime() - first.receivedAt.getTime());

    const hasActiveDeposit = requests.some(
      (request) =>
        request.status === PackageRequestStatus.APPROVED &&
        request.requestType === PackageRequestType.INVESTMENT,
    );
    const canEarnReferralBonus = hasActiveDeposit || user.registrationApproved;

    if (canEarnReferralBonus) {
      const levelRates = [0.02, 0.02, 0.01, 0.01, 0.01];
      let levelMembers = await this.usersService.findByReferrer(user.id);

      for (let level = 0; level < levelRates.length; level += 1) {
        for (const member of levelMembers) {
          const memberRequests = await this.findByUser(member);

          for (const request of memberRequests) {
            if (
              request.status !== PackageRequestStatus.APPROVED ||
              request.requestType !== PackageRequestType.INVESTMENT
            ) continue;

            const receivedAt = request.reviewedAt ?? request.createdAt;
            const elapsedDays = Math.min(
              Math.floor(Math.max(0, now.getTime() - new Date(receivedAt).getTime()) / dayInMilliseconds),
              profitPeriodDays,
            );
            const dailyProfit = (Number(request.amount) * profitRate) / profitPeriodDays;
            const source = `${member.fullName || member.email} deposit (Level ${level + 1})`;

            if (level === 0 && hasActiveDeposit) {
              history.push({
                id: `referral-${request.id}-direct`,
                receivedAt: new Date(receivedAt),
                source,
                paymentMethod: request.paymentMethod || 'Online USDT Deposit',
                depositAmount: Number(request.amount),
                profitAmount: Number((Number(request.amount) * 0.08).toFixed(2)),
              });
            }

            for (let day = 0; day < elapsedDays; day += 1) {
              history.push({
                id: `referral-${request.id}-${level}-${day + 1}`,
                receivedAt: new Date(new Date(receivedAt).getTime() + (day + 1) * dayInMilliseconds),
                source,
                paymentMethod: request.paymentMethod || 'Online USDT Deposit',
                depositAmount: Number(request.amount),
                profitAmount: Number((dailyProfit * levelRates[level]).toFixed(2)),
              });
            }
          }
        }

        const nextLevelMembers: User[] = [];
        for (const member of levelMembers) {
          nextLevelMembers.push(...(await this.usersService.findByReferrer(member.id)));
        }
        levelMembers = nextLevelMembers;
      }
    }

    return history.sort(
      (first, second) => second.receivedAt.getTime() - first.receivedAt.getTime(),
    );
  }

  async findPendingRequests(): Promise<PackageRequest[]> {
    return await this.packageRequestRepository.find({
      where: {
        status: PackageRequestStatus.PENDING,
        requestType: PackageRequestType.INVESTMENT,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findPendingRegistrationRequests(): Promise<PackageRequest[]> {
    return await this.packageRequestRepository.find({
      where: {
        status: PackageRequestStatus.PENDING,
        requestType: PackageRequestType.REGISTRATION,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getAdminDashboard() {
    const pendingCount = await this.packageRequestRepository.count({
      where: { status: PackageRequestStatus.PENDING },
    });
    const approvedCount = await this.packageRequestRepository.count({
      where: { status: PackageRequestStatus.APPROVED },
    });
    const rejectedCount = await this.packageRequestRepository.count({
      where: { status: PackageRequestStatus.REJECTED },
    });
    const totalCount = await this.packageRequestRepository.count();

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
    };
  }

  async approveRequest(id: number, adminUser: User): Promise<PackageRequest> {
    const request = await this.packageRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Package request not found');
    }

    if (request.status !== PackageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    request.status = PackageRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    request.reviewedBy = adminUser.email;

    return await this.packageRequestRepository.save(request);
  }

  async approveRegistrationRequest(id: number, adminUser: User): Promise<PackageRequest> {
    const request = await this.packageRequestRepository.findOne({
      where: { id, requestType: PackageRequestType.REGISTRATION },
    });

    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== PackageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending registration requests can be approved');
    }

    request.status = PackageRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    request.reviewedBy = adminUser.email;
    request.user.registrationApproved = true;
    await this.usersService.save(request.user);

    return await this.packageRequestRepository.save(request);
  }

  async rejectRequest(id: number, adminUser: User, reason?: string): Promise<PackageRequest> {
    const request = await this.packageRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Package request not found');
    }

    if (request.status !== PackageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    request.status = PackageRequestStatus.REJECTED;
    request.reviewedAt = new Date();
    request.reviewedBy = adminUser.email;
    request.notes = reason ? `${request.notes || ''} Rejection reason: ${reason}` : request.notes;

    return await this.packageRequestRepository.save(request);
  }

  async rejectRegistrationRequest(id: number, adminUser: User, reason?: string): Promise<PackageRequest> {
    const request = await this.packageRequestRepository.findOne({
      where: { id, requestType: PackageRequestType.REGISTRATION },
    });

    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    if (request.status !== PackageRequestStatus.PENDING) {
      throw new BadRequestException('Only pending registration requests can be rejected');
    }

    request.status = PackageRequestStatus.REJECTED;
    request.reviewedAt = new Date();
    request.reviewedBy = adminUser.email;
    request.notes = reason ? `${request.notes || ''} Rejection reason: ${reason}` : request.notes;

    return await this.packageRequestRepository.save(request);
  }
}
