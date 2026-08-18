import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { WithdrawalsService } from './withdrawals.service';

@ApiTags('Withdrawals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a withdrawal request' })
  submit(@Req() req: any, @Body() dto: CreateWithdrawDto) {
    return this.withdrawalsService.createWithdrawal(req.user, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user withdrawals' })
  getMy(@Req() req: any) {
    return this.withdrawalsService.findByUser(req.user);
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get available balances (earnings and bonus) for current user' })
  getBalances(@Req() req: any) {
    return this.withdrawalsService.getBalances(req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/pending')
  @ApiOperation({ summary: 'Get pending withdrawal requests for admin review' })
  getPendingWithdrawals() {
    return this.withdrawalsService.findPendingWithdrawals();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats for withdrawals' })
  getAdminDashboard() {
    return this.withdrawalsService.getAdminDashboard();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/:id/approve')
  @ApiOperation({ summary: 'Approve a pending withdrawal request' })
  approveWithdrawal(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.withdrawalsService.approveWithdrawal(id, req.user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/:id/reject')
  @ApiOperation({ summary: 'Reject a pending withdrawal request' })
  rejectWithdrawal(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body('reason') reason?: string) {
    return this.withdrawalsService.rejectWithdrawal(id, req.user, reason);
  }
}
