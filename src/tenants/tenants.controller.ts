import { Controller, Get, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { IsMaster } from '../common/decorators/is-master.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';

@IsMaster()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    console.log('MASTER DB URL:', process.env.MASTER_DATABASE_URL);
    return this.tenantsService.findAll();
  }

  @Post('add')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  
}
