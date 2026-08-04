import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackageRequestsController } from './package-requests.controller';
import { PackageRequestsService } from './package-requests.service';
import { PackageRequest } from './entities/package-request.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PackageRequest]), AuthModule],
  controllers: [PackageRequestsController],
  providers: [PackageRequestsService],
  exports: [PackageRequestsService],
})
export class PackageRequestsModule {}
