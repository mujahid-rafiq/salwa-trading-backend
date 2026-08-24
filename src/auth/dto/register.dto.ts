import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'Mujahid Rafiq',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({
    example: 'mujahid@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '03001234567',
  })
  @IsNotEmpty()
  @Matches(/^(\+92|0)?3\d{9}$/)
  phoneNumber!: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  password!: string;

  @ApiPropertyOptional({ example: 'SALWA8A1B2C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  referralCode?: string;
}