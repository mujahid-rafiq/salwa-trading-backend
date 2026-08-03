import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { CreatePackageRequestDto } from './dto/create-package-request.dto';
import { PackageRequestsService } from './package-requests.service';

@ApiTags('Package Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('package-requests')
export class PackageRequestsController {
  constructor(
    private readonly packageRequestsService: PackageRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a package purchase request' })
  @ApiResponse({ status: 201, description: 'Package request submitted successfully' })
  submitRequest(@Req() req: any, @Body() createDto: CreatePackageRequestDto) {
    return this.packageRequestsService.createRequest(req.user, createDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user package requests' })
  getMyRequests(@Req() req: any) {
    return this.packageRequestsService.findByUser(req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/pending')
  @ApiOperation({ summary: 'Get pending package purchase requests for admin review' })
  getPendingRequests() {
    return this.packageRequestsService.findPendingRequests();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats for package requests' })
  getAdminDashboard() {
    return this.packageRequestsService.getAdminDashboard();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/:id/approve')
  @ApiOperation({ summary: 'Approve a pending package purchase request' })
  approveRequest(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.packageRequestsService.approveRequest(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/:id/reject')
  @ApiOperation({ summary: 'Reject a pending package purchase request' })
  rejectRequest(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.packageRequestsService.rejectRequest(id, req.user, reason);
  }
}
