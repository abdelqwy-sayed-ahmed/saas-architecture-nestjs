import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService:TenantService

  ) {}

  async findAll() {
    return this.prisma.tenant.user.findMany();
  }

  async create(data: { email: string; name?: string }) {
    return this.prisma.tenant.user.create({ data });
  }
}
