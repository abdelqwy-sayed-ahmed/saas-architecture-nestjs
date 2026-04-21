import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class SettingItemDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class TenantSettingsDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings!: SettingItemDto[];
  
}
