import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prismaService: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
    return this.tenantContext.getAls().run({}, () => next());
  }
   
      try {
        // tenant with config and settings from Master DB
        const metadata = await this.prismaService.getTenantClientConfig(tenantId);

        // Ensure tenant DB connection is ready (singleton in PrismaService)
        await this.prismaService.getTenantClientConnection(tenantId, metadata?.config);
     
        // Run with context
        this.tenantContext.getAls().run({ tenantId, settings:metadata?.settings }, () => next());
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        throw new UnauthorizedException('Error initializing tenant context.');
      }
    
  }
}
