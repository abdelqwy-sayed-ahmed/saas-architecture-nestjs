# Multi-Tenant NestJS Backend

A multi-tenant backend architecture built with **NestJS, Prisma, and MySQL**, using the **database-per-tenant** isolation strategy.

The project demonstrates how to manage tenant registration, dynamically connect to tenant databases, maintain request-level tenant context, and apply database migrations across multiple tenants.

## Architecture Overview

The application separates administrative data from tenant-specific data:

- **Master database:** Stores tenant registration information and database connection configuration.
- **Tenant databases:** Each tenant has an isolated database for its application data.
- **Master Prisma client:** Handles administrative operations.
- **Tenant Prisma client:** Handles tenant-specific operations.
- **Tenant context:** Uses Node.js `AsyncLocalStorage` to maintain tenant information and settings throughout a request.

## Key Features

### 1. Separate Prisma Schemas and Clients

The project maintains two Prisma schemas:

- `prisma/master/schema.prisma` — defines master database models, including tenant registration and connection configuration.
- `prisma/tenant/schema.prisma` — defines models for tenant-specific data, such as users.

Prisma clients are generated separately into `prisma-client/master` and `prisma-client/tenant`, keeping the two data-access layers distinct.

### 2. Dynamic Tenant Database Connections

Tenant connections are created lazily when needed and cached for reuse.

The `PrismaService` manages tenant-specific Prisma clients to avoid creating a new client for every request.

When a tenant is registered through `TenantManagementService`, the application can create the tenant database and apply the required migrations.

### 3. Tenant Context with AsyncLocalStorage

`TenantContextService` uses Node.js `AsyncLocalStorage` to make tenant-specific information available throughout the asynchronous request lifecycle.

The `TenantContextMiddleware`:

1. Reads the `x-tenant-id` request header.
2. Prepares the tenant database connection.
3. Populates the tenant context with the tenant ID and associated settings.

### 4. Tenant Routing and Master Operations

A global `TenantGuard` requires the `x-tenant-id` header by default.

Routes or controllers decorated with `@IsMaster()` can bypass the tenant-header requirement to perform administrative operations against the master database.

**Security note:** A tenant ID supplied by a request is an identifier, not proof of authorization. Production applications should authenticate callers and verify that they are permitted to access the selected tenant.

### 5. Automated Database Migrations

The project provides scripts for managing schema changes:

- `npm run migrate:master` — applies migrations to the master database.
- `npm run migrate:tenants` — iterates through registered tenants and applies migrations to their databases.

See the migration scripts for their exact failure-handling and rollback behavior before using them in production.

## Technology Stack

- **Backend:** NestJS, Node.js, TypeScript
- **Database:** MySQL
- **ORM:** Prisma
- **Architecture:** Database-per-tenant, multi-tenant backend
- **Request context:** Node.js AsyncLocalStorage

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL
- The environment and database permissions required by the migration scripts

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```env
MASTER_DATABASE_URL="mysql://user:password@localhost:3306/master_db"
TENANT_DATABASE_URL="mysql://user:password@localhost:3306/dev_tenant_db"
```

Use your own local database credentials. The tenant URL is used for generating tenant migrations.

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Clients

```bash
npm run prisma-client:generate
```

### 4. Apply Master Migrations

```bash
npm run migrate:master
```

### 5. Start the Application

```bash
npm run start:dev
```

Ensure that any additional database initialization or tenant onboarding steps required by the repository are completed before testing tenant APIs.

## Usage Examples

### Tenant Database Access

Tenant controllers and services use the tenant Prisma client:

```typescript
constructor(private readonly prisma: PrismaService) {}

async someMethod() {
  return this.prisma.tenant.user.findMany();
}
```

The tenant connection is selected through the request's tenant context.

### Master Database Access

Administrative operations use the master Prisma client:

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

### Reading Tenant Context

```typescript
constructor(
  private readonly tenantContext: TenantContextService,
) {}

async someMethod() {
  const tenantId = this.tenantContext.getTenantId();
  const settings = this.tenantContext.getSettings();
}
```

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | Start in development mode |
| `npm run prisma-client:generate` | Generate master and tenant Prisma clients |
| `npm run generate:master -- <name>` | Create a master migration |
| `npm run generate:tenant -- <name>` | Create a tenant migration |
| `npm run migrate:master` | Apply master migrations |
| `npm run migrate:tenants` | Apply migrations to registered tenant databases |
| `npm run revert:tenant` | Run the tenant migration-revert script |

Check the scripts' implementation for their exact behavior and prerequisites.

## License

UNLICENSED
