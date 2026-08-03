import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageRequestsController } from './package-requests.controller';
import { PackageRequestsService } from './package-requests.service';
import { PackageRequest } from './entities/package-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PackageRequest])],
  controllers: [PackageRequestsController],
  providers: [PackageRequestsService],
  exports: [PackageRequestsService],
})
export class PackageRequestsModule {}
