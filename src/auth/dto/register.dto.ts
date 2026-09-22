import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
    example: '+12025550123',
    description: 'International phone number in E.164 format',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s\-().]/g, '') : value,
  )
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message:
      'Phone number must include a country code, e.g. +12025550123 or +447911123456',
  })
  @MaxLength(16)
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