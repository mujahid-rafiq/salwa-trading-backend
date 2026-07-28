import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'mujahid@gmail.com' })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otpCode!: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
