import {
  Injectable,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient as MasterClient } from '../prisma-client/master';
import { PrismaClient as TenantClient } from '../prisma-client/tenant';
import { TenantContextService } from '../tenant-context/tenant-context.service';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private masterClientInstance: MasterClient;
  private readonly tenantClients: Map<string, TenantClient> = new Map();
  private readonly tenantConfigs: Map<
    string,
    { config: any; settings: Record<string, string> }
  > = new Map();

  constructor(private readonly tenantContext: TenantContextService) {
    this.masterClientInstance = new MasterClient();
  }

  get master(): MasterClient {
    return this.masterClientInstance;
  }

  invalidateTenantCache(tenantCode: string) {
    this.tenantConfigs.delete(tenantCode); 
  }

  invalidateTenantConnection(tenantCode: string) {
    this.tenantClients.delete(tenantCode); 
  }

  async getTenantClientConfig(tenantId: string) {
    // Check memory first
    if (this.tenantConfigs.has(tenantId)) {
      // console.log('from cacheee')
      return this.tenantConfigs.get(tenantId);
    }

    // If not in memory, hit Master DB
    const tenant = await this.master.tenant.findUnique({
      where: { code: tenantId },
      include: { config: true, settings: true },
    });

    if (!tenant || !tenant.config) {
      throw new UnauthorizedException(
        `Tenant ${tenantId} not found or misconfigured.`,
      );
    }

    const settings = tenant.settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const metadata = { config: tenant.config, settings };

    // Store for future requests
    // console.log('cachingggggggg')
    this.tenantConfigs.set(tenantId, metadata);
    return metadata;
  }

  async getTenantClientConnection(tenantId: string, config: any): Promise<TenantClient> {
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
    const context = this.tenantContext.getStore();
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
