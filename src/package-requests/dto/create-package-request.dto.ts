import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreatePackageRequestDto {
  @ApiProperty({ example: 'Starter' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  packageName!: string;

  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(100)
  amount!: number;

  @ApiProperty({ example: 'JazzCash' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  paymentMethod!: string;

  @ApiProperty({ example: '1% Daily' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  profitRate!: string;

  @ApiProperty({ example: '30 Days' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  duration!: string;

  @ApiPropertyOptional({ example: 'TRX45827910' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionId?: string;

  @ApiPropertyOptional({ example: '/uploads/payments/1711111234567.png' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentScreenshotUrl?: string;

  @ApiPropertyOptional({ example: 'Sent to OKX deposit account' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
