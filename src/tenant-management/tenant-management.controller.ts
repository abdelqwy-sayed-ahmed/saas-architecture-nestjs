import { Controller, Get, Post, Body } from '@nestjs/common';
import { IsMaster } from '../common/decorators/is-master.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantSettingsDto } from './dto/tenant-settings.dto';
import { TenantManagementService } from './tenant-management.service';

@IsMaster()
@Controller('tenants')
export class TenantManagementController {
  constructor(private readonly tenantService: TenantManagementService) {}

  @Get()
  getAlltenants() {
    return this.tenantService.getAllTenants();
  }

  @Post('add')
  addNewTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.createNewTenant(dto);
  }

  @Post('settings')
  updateTenantSettings(@Body() dto:TenantSettingsDto){
    return this.tenantService.updateTenantSettings(dto)
  }




  
}
