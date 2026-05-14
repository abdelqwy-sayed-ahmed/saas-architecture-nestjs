import { IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator";


export class SendMessageDto{
    @IsNotEmpty()
    @IsInt()
    senderId!:number

    @IsNotEmpty()
    @IsInt()
    roomId!:number

    @IsNotEmpty()
    @IsString()
    content!:string

}