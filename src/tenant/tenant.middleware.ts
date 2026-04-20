import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { IS_MASTER_KEY } from '../common/decorators/is-master.decorator';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Determine if it's a master route
    // Note: reflector won't work easily here because the route handler isn't matched yet.
    // We'll move the 401 check and context setting to a Guard for better IsMaster support.
    // But we still need to capture tenantId from header.
    
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (tenantId) {
      try {
        // Fetch config from Master DB
        const tenant = await this.prismaService.master.tenant.findUnique({
          where: { code: tenantId },
          include: { config: true },
        });

        if (!tenant || !tenant.config) {
          throw new UnauthorizedException(`Tenant ${tenantId} not found or misconfigured.`);
        }

        // Ensure tenant DB connection is ready (singleton in PrismaService)
        const tenantClient = await this.prismaService.getTenantClient(tenantId, tenant.config);
        
        // Fetch settings from Tenant DB
        // const settingsArray = await tenantClient.setting.findMany();
        // const settings = settingsArray.reduce((acc, curr) => {
        //   acc[curr.key] = curr.value;
        //   return acc;
        // }, {} as Record<string, string>);

        // Run with context
        // this.tenantService.getAls().run({ tenantId, settings }, () => next());
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Error initializing tenant context.');
      }
    } else {
      // No tenant ID, just run without context (Guard will handle 401 if not IsMaster)
      this.tenantService.getAls().run({}, () => next());
    }
  }
}
