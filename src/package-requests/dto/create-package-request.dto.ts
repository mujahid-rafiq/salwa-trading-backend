import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

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
  amount!: number;

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

  @ApiPropertyOptional({ example: 'Sent to OKX deposit account' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
