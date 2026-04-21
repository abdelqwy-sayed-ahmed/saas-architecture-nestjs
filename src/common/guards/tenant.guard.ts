import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_MASTER_KEY } from '../decorators/is-master.decorator';
import { TenantContextService } from '../../tenant-context/tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isMaster = this.reflector.getAllAndOverride<boolean>(IS_MASTER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const contextStore = this.tenantContext.getStore();
    const hasTenant = !!contextStore?.tenantId;

    if (isMaster) {
      return true; // Allow if decorated with @IsMaster()
    }

    if (!hasTenant) {
      throw new UnauthorizedException('Missing x-tenant-id header.');
    }
    return true;
  }
}
