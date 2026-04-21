import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { execSync } from 'child_process';
import * as path from 'path';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantSettingsDto } from './dto/tenant-settings.dto';
@Injectable()
export class TenantManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllTenants() {
    return this.prisma.master.tenant.findMany({
      include: { config: true, settings: true },
    });
  }

  async createNewTenant(data: CreateTenantDto) {
    // 1. Validation: Check if tenant code already exists
    const existingTenant = await this.prisma.master.tenant.findUnique({
      where: { code: data.code },
    });

    if (existingTenant) {
      throw new ConflictException(`Tenant code '${data.code}' already exists.`);
    }

    try {
      // 2. Create the tenant record and config in Master DB
      const newTenant = await this.prisma.master.tenant.create({
        data: {
          name: data.name,
          code: data.code,
          config: {
            create: data.config,
          },
        },
        include: { config: true },
      });

      // 3. Create the Database dynamically
      const { dbName, username, password, host, port } = data.config;
      await this.prisma.master.$executeRawUnsafe(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\``,
      );
      console.log(` ${dbName} Database has been created successfully.`);

      // 4. Run Migrations for the new tenant
      const dbUrl = `mysql://${username}:${password}@${host}:${port}/${dbName}`;
      const schemaPath = path.join(
        process.cwd(),
        'prisma/tenant/schema.prisma',
      );

      console.log(
        `Running migrations for tenant '${data.code}' on database '${dbName}'...`,
      );

      execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
        env: {
          ...process.env,
          TENANT_DATABASE_URL: dbUrl,
        },
        stdio: 'inherit',
      });

      console.log(`Migrations successfully applied to '${dbName}'.`);

      return newTenant;
    } catch (error: any) {
      console.error('Error during tenant creation:', error.message);
      // In a real production app, you might want to implement a rollback strategy here
      throw new InternalServerErrorException(
        `Failed to create tenant: ${error.message}`,
      );
    }
  }

  async updateTenantSettings(dto: TenantSettingsDto) {
    const tenant = await this.prisma.master.tenant.findUnique({
      where: {
        code: dto.code,
      },
      select:{id:true}
    });
    if (!tenant)
      throw new NotFoundException({ message: 'tenant code is not valid' });
    
    const settings= await this.prisma.master.$transaction(
      dto.settings.map((item) =>
        this.prisma.master.setting.upsert({
          where: {
            tenantId_key: {
              tenantId: tenant.id,
              key: item.key,
            },
          },
          update: {
            value: item.value,
          },
          create: {
            key: item.key,
            value: item.value,
            tenantId: tenant.id,
          },
        }),
      ),
    );

    this.prisma.invalidateTenantCache(dto.code);
    return settings
  }
}
