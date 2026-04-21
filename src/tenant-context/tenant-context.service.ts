import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId?: string;
  settings?: Record<string, string>;
  isMaster?: boolean;
}

@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  getStore() {
    return this.als.getStore();
  }

  getTenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }

  getSettings(): Record<string, string> | undefined {
    return this.als.getStore()?.settings;
  }

  getAls() {
    return this.als;
  }
}
