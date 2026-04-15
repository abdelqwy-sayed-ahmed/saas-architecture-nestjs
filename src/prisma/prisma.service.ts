import { Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import { PrismaClient as MasterClient } from '../prisma-client/master';
import { PrismaClient as TenantClient } from '../prisma-client/tenant';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private masterClientInstance: MasterClient;
  private readonly tenantClients: Map<string, TenantClient> = new Map();

  constructor(private readonly tenantService: TenantService) {
    this.masterClientInstance = new MasterClient();
  }

  get master(): MasterClient {
    return this.masterClientInstance;
    
  }

  async getTenantClient(tenantId: string, config: any): Promise<TenantClient> {
    if (!this.tenantClients.has(tenantId)) {
      const dbUrl = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.dbName}`;
      
      const client = new TenantClient({
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });
      
      await client.$connect();
      this.tenantClients.set(tenantId, client);
    }
    return this.tenantClients.get(tenantId)!;
  }

  get tenant(): TenantClient {
    const context = this.tenantService.getStore();
    if (!context || !context.tenantId) {
      throw new UnauthorizedException('Tenant context not found.');
    }

    const client = this.tenantClients.get(context.tenantId);
    if (!client) {
      throw new Error(`Tenant client for ${context.tenantId} not initialized.`);
    }

    return client;
  }

  async onModuleDestroy() {
    await this.masterClientInstance.$disconnect();
    for (const client of this.tenantClients.values()) {
      await client.$disconnect();
    }
  }
}
