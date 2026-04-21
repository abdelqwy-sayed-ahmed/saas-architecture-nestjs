import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant-context/tenant-context.service';
import { CREATEUSERDTO } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return await this.prisma.tenant.user.findMany();
  }

  async createUser(dto: CREATEUSERDTO) {
    return await this.prisma.tenant.user.create({
      data: dto,
    });
  }
}
