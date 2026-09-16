import { OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { CreatePackageRequestDto } from './create-package-request.dto';

export class CreateRegistrationRequestDto extends OmitType(CreatePackageRequestDto, ['amount'] as const) {
  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(10)
  amount!: number;
}