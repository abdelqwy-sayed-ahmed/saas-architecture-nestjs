import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { RoomType } from '../../../prisma-client/tenant';

export class CreateRoomDto {
  @IsEnum(RoomType)
  type!: RoomType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsInt()
  @IsNotEmpty()
  creatorId!:number


  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  memberIds!: number[];
}
