import { TenantMiddleware } from '../../../src/tenant/tenant.middleware';

describe('TenantMiddleware', () => {
  it('should be defined', () => {
    expect(new TenantMiddleware()).toBeDefined();
  });
});
