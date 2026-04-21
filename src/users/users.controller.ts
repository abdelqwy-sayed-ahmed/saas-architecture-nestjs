import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CREATEUSERDTO } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@Get()
async getAllUsers(){
  return await this.usersService.getAllUsers()
}

@Post()
async createUser(@Body() dto:CREATEUSERDTO){
  return await this.usersService.createUser(dto)
}
}
