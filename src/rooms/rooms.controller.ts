import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomService: RoomsService) {}

  @Post()
  async createroom(@Body() dto: CreateRoomDto) {
    return this.roomService.createRoom(dto);
  }

  @Get('')
  async getSingleRoomForuser(
    @Query('roomId') roomId: number,
    @Query('userId') userId: number,
  ) {
    if (!roomId || !userId)
      throw new BadRequestException('roomId or userId is missing');
    return await this.roomService.getUserRoomById(roomId, userId);
  }

  @Get('/member/:userId')
  async getAllUserrooms(@Param('userId') userId: number) {
    return await this.roomService.getUserRooms(userId);
  }
}
