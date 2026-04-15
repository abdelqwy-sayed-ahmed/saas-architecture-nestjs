# Multi-Tenant NestJS Backend

A robust multi-tenant backend architecture built with **NestJS**, **Prisma**, and **MySQL**, supporting isolated databases per tenant (schema-per-tenant).

## 🚀 Key Features

### 1. Split Prisma Schemas
The project uses two separate Prisma schemas to maintain clear isolation between administrative data and tenant-specific data:
- **Master Schema (`prisma/master/schema.prisma`):** Manages tenant registration, codes, and database connection configurations (host, port, credentials).
- **Tenant Schema (`prisma/tenant/schema.prisma`):** Defines the data structure for individual tenants (e.g., Users, Settings).
- **Separate Clients:** Prisma clients are generated into `src/prisma-client/master` and `src/prisma-client/tenant` to prevent type collisions.

### 2. Dynamic Connection Management (Singleton)
- **Lazy Loading:** Tenant database connections are established only when the first request for that tenant arrives.
- **Singleton Pattern:** Once established, `PrismaClient` instances are cached in a `Map` within `PrismaService`. This prevents unnecessary connection overhead and limits database traffic.
- **Resource Cleanup:** All connections (Master + all active Tenants) are gracefully disconnected on module destruction.

### 3. Tenant Context & Global Settings
- **AsyncLocalStorage:** Uses Node.js `AsyncLocalStorage` to store the `tenantId` and tenant-specific `settings` for the duration of each request.
- **Auto-Population:** The `TenantMiddleware` automatically fetches the tenant's configuration from the Master DB and populates the `settings` table from the Tenant DB before the request reaches the controller.

### 4. Smart Authorization & `@IsMaster()`
- **Global Guard:** A `TenantGuard` is applied globally. It requires the `x-tenant-id` header for all requests by default (401 Unauthorized if missing).
- **Master Bypass:** Routes or Controllers decorated with `@IsMaster()` bypass the tenant check and interact directly with the Master DB. This is ideal for administrative tasks like creating new tenants.

### 5. Multi-Tenant Migrations
- **Master Migrations:** `npm run prisma:migrate:master`
- **Tenant Schema Development:** `npm run prisma:migrate:tenant`
- **Production Migration Script:** `npm run migrate:tenants`
    - Sequentially migrates the Master DB.
    - Fetches all active tenants from the Master DB.
    - Dynamically connects to and applies migrations to every individual tenant database.

---

## 🛠 Project Setup

### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# URL for the Master Database
MASTER_DATABASE_URL="mysql://user:password@localhost:3306/master_db"

# URL for a local/dev Tenant Database (used for 'prisma migrate dev' on the tenant schema)
TENANT_DATABASE_URL="mysql://user:password@localhost:3306/dev_tenant_db"
```

### Installation
```bash
$ npm install
```

### Database Initialization
1.  Generate Prisma Clients:
    ```bash
    $ npm run prisma:generate
    ```
2.  Push initial schema to Master:
    ```bash
    $ npm run prisma:migrate:master
    ```

---

## 📖 Usage

### Tenant APIs
Standard controllers require the `x-tenant-id` header. Access the tenant-specific Prisma client in your services:
```typescript
constructor(private readonly prisma: PrismaService) {}

async someMethod() {
  // Uses the connection derived from the request header
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

### Accessing Settings
Tenant-specific settings are available via `TenantService`:
```typescript
const settings = this.tenantService.getSettings();
const theme = settings['theme'];
```

---

## 📜 Scripts

- `npm run start:dev`: Start the NestJS application in watch mode.
- `npm run prisma:generate`: Generate both Master and Tenant Prisma clients.
- `npm run prisma:migrate:master`: Create/apply migrations for the Master database.
- `npm run prisma:migrate:tenant`: Create migrations for the Tenant schema (local dev).
- `npm run migrate:tenants`: **[Production]** Apply migrations to the Master DB and ALL tenant databases.

## License
This project is [MIT licensed](LICENSE).
