import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PackageRequest } from './entities/package-request.entity';
import { CreatePackageRequestDto } from './dto/create-package-request.dto';
import { PackageRequestStatus } from '../enums/package-request-status.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PackageRequestsService {
  constructor(
    @InjectRepository(PackageRequest)
    private readonly packageRequestRepository: Repository<PackageRequest>,
  ) {}

  async createRequest(user: User, createDto: CreatePackageRequestDto): Promise<PackageRequest> {
    const request = this.packageRequestRepository.create({
      user,
      packageName: createDto.packageName,
      amount: createDto.amount,
      profitRate: createDto.profitRate,
      duration: createDto.duration,
      transactionId: createDto.transactionId,
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

  async findPendingRequests(): Promise<PackageRequest[]> {
    return await this.packageRequestRepository.find({
      where: {
        status: PackageRequestStatus.PENDING,
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
}
