import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConfigDto {
  @IsString()
  @IsNotEmpty()
  dbName!: string;

  @IsString()
  @IsNotEmpty()
  host!: string;

  @Type(() => Number) //help if user send "3306" instead 3306
  @IsNumber()
  @IsNotEmpty()
  port!: number;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ConfigDto)
  config!: ConfigDto;
}
