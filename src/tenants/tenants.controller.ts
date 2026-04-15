import { Controller, Get, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { IsMaster } from '../common/decorators/is-master.decorator';

@Controller('tenants')
@IsMaster()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    console.log('MASTER DB URL:', process.env.MASTER_DATABASE_URL);
    return this.tenantsService.findAll();
  }

  @Post('add')
  create(@Body() data: { name: string; code: string; config: any }) {
    return this.tenantsService.create(data);
  }
}
