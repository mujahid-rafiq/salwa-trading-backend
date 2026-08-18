import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export enum WithdrawSource {
  EARNINGS = 'earnings',
  BONUS = 'bonus',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'Bank transfer',
  EASY_PAISA = 'EasyPaisa',
  JAZZ_CASH = 'JazzCash',
}

export class CreateWithdrawDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(WithdrawSource)
  source!: WithdrawSource;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  bankName?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  iban?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  accountTitle?: string;

  @IsOptional()
  @IsString()
  @Length(5, 50)
  mobileNumber?: string;

  @IsOptional()
  notes?: string;
}
