# Multi-Tenant NestJS Backend

A robust multi-tenant backend architecture built with **NestJS**, **Prisma**, and **MySQL**, supporting isolated databases per tenant (Database-per-tenant).

## 🚀 Key Features

### 1. Split Prisma Schemas
The project uses two separate Prisma schemas to maintain clear isolation between administrative data and tenant-specific data:
- **Master Schema (`prisma/master/schema.prisma`):** Manages tenant registration, codes, and database connection configurations (host, port, credentials).
- **Tenant Schema (`prisma/tenant/schema.prisma`):** Defines the data structure for individual tenants (e.g., Users).
- **Separate Clients:** Prisma clients are generated into `prisma-client/master` and `prisma-client/tenant` to prevent type collisions and keep the `src` directory clean.

### 2. Dynamic Connection Management (Singleton)
- **Lazy Loading:** Tenant database connections are established only when the first request for that tenant arrives.
- **Singleton Pattern:** Once established, `PrismaClient` instances are cached within `PrismaService`. This prevents unnecessary connection overhead.
- **Dynamic Creation:** When a new tenant is created via `TenantManagementService`, the MySQL database is created dynamically, and migrations are applied automatically.

### 3. Tenant Context & Global Settings
- **AsyncLocalStorage:** Uses Node.js `AsyncLocalStorage` via `TenantContextService` to store the `tenantId` and tenant-specific `settings` for the duration of each request.
- **Context Middleware:** The `TenantContextMiddleware` extracts the `x-tenant-id` header, ensures the database connection is ready, and populates the context.

### 4. Smart Authorization & `@IsMaster()`
- **Global Guard:** A `TenantGuard` is applied globally. It requires the `x-tenant-id` header for all requests by default.
- **Master Bypass:** Routes or Controllers decorated with `@IsMaster()` bypass the tenant check and interact directly with the Master DB. This is used for administrative tasks like tenant onboarding.

### 5. Automated Migrations
- **Master Migrations:** `npm run migrate:master`
- **Tenant Migration Deployment:** `npm run migrate:tenants`
    - Iterates through all tenants registered in the Master DB and applies the latest migrations to each individual database.

---

## 🛠 Project Setup

### Environment Variables
Create a `.env` file in the root directory:

```env
# URL for the Master Database
MASTER_DATABASE_URL="mysql://user:password@localhost:3306/master_db"

# URL for a local/dev Tenant Database (used for generating tenant migrations)
TENANT_DATABASE_URL="mysql://user:password@localhost:3306/dev_tenant_db"
```

### Installation
```bash
$ npm install
```

### Database Initialization
1.  Generate Prisma Clients:
    ```bash
    $ npm run prisma-client:generate
    ```
2.  Deploy Master migrations:
    ```bash
    $ npm run migrate:master
    ```

---

## 📖 Usage

### Tenant APIs
Standard controllers require the `x-tenant-id` header. Access the tenant-specific Prisma client in your services:
```typescript
constructor(private readonly prisma: PrismaService) {}

async someMethod() {
  // Uses the connection derived from the request header (x-tenant-id)
  return this.prisma.tenant.user.findMany(); 
}
```

### Master APIs
Use the `@IsMaster()` decorator to target the administrative database:
```typescript
@Controller('tenants')
@IsMaster()
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.master.tenant.findMany();
  }
}
```

### Accessing Context
Tenant-specific context is available via `TenantContextService`:
```typescript
constructor(private readonly tenantContext: TenantContextService) {}

async someMethod() {
  const tenantId = this.tenantContext.getTenantId();
  const settings = this.tenantContext.getSettings();
}
```

---

## 📜 Scripts

- `npm run start:dev`: Start the application in watch mode.
- `npm run prisma-client:generate`: Generate both Master and Tenant Prisma clients.
- `npm run generate:master -- <name>`: Create a new migration for the Master schema.
- `npm run generate:tenant -- <name>`: Create a new migration for the Tenant schema.
- `npm run migrate:master`: Apply migrations to the Master database.
- `npm run migrate:tenants`: Apply migrations to ALL tenant databases registered in the Master DB.
- `npm run revert:tenant`: Revert the last migration on tenant databases.

## License
This project is UNLICENSED.
