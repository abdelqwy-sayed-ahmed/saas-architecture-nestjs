import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

@Get()
async getAllUsers(){
  return await this.usersService.getAllUsers()
}
}
