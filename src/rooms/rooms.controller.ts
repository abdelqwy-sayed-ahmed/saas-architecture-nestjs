import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RoomsService } from "./rooms.service";
import { CreateRoomDto } from "./dto/create-room.dto";

@Controller('rooms')

export class RoomsController{
    constructor(
        private readonly roomService:RoomsService
    ){}


 @Post()
 async createroom(@Body() dto:CreateRoomDto){
    return this.roomService.createRoom(dto)
 }

 @Get('/user/:userId')
 async getAllUserrooms(@Param('userId') userId:number){
    return await this.roomService.getUserRooms(userId)
 }

}