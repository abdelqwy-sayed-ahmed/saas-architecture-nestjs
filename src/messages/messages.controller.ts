import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller('messages')
export class MessagesController{
    constructor(
        readonly messageService:MessagesService
    ){}
  
    @Post('')
    async sendMessage(@Body() dto:SendMessageDto){
      return await this.messageService.sendMessage(dto)
    }

    @Get('')
    async getRommMessages(@Query('roomId') roomId:number,@Query('userId') userId:number,@Query('cursor')cursor?:number){
       return this.messageService.getMessages(roomId,userId,cursor)
    }
    
}
