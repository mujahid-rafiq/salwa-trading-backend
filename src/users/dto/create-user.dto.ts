import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

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

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  password!: string;
}