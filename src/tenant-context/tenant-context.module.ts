import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    TenantContextService,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [TenantContextService],
})
export class TenantContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
