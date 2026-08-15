import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
}
