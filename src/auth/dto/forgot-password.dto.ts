import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'mujahid@gmail.com',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;
}
