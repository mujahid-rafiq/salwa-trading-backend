import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export enum WithdrawSource {
  EARNINGS = 'earnings',
  BONUS = 'bonus',
}

export class CreateWithdrawDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(WithdrawSource)
  source!: WithdrawSource;

  @IsOptional()
  notes?: string;
}
