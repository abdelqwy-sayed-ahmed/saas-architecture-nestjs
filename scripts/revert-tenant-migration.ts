import { PrismaClient as MasterClient } from '../prisma-client/master';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PrismaClient as TenantClient } from '../prisma-client/tenant';

dotenv.config();

const masterDbUrl = process.env.MASTER_DATABASE_URL;
const shadowDbUrl = process.env.TENANT_DATABASE_URL; // Used as shadow DB for diffing

if (!masterDbUrl || !shadowDbUrl) {
  console.error('Error: MASTER_DATABASE_URL and DATABASE_URL (shadow) must be defined in .env');
  process.exit(1);
}

async function revertLastMigration() {
  const masterClient = new MasterClient();
  const migrationsDir = path.join(process.cwd(), 'prisma/tenant/migrations');
  const tempMigrationsDir = path.join(process.cwd(), 'prisma/tenant/.temp_migrations');

  try {
    // 1. Identify the last migration
    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort((a, b) => b.localeCompare(a));

    const lastMigrationName = migrationDirs[0];
    if (!lastMigrationName) {
      console.log('No migrations found to revert.');
      return;
    }

    console.log(`\nStep 1: Identified last migration to revert: ${lastMigrationName}`);

    // 2. Prepare a temporary migration folder EXCLUDING the last migration
    // This allows Prisma to diff the DB against the "intended" previous state
    if (fs.existsSync(tempMigrationsDir)) fs.rmSync(tempMigrationsDir, { recursive: true });
    fs.mkdirSync(tempMigrationsDir, { recursive: true });
    
    migrationDirs.slice(1).forEach(dir => {
      const src = path.join(migrationsDir, dir);
      const dest = path.join(tempMigrationsDir, dir);
      fs.cpSync(src, dest, { recursive: true });
    });

    // 3. Fetch all tenants
    const tenants = await masterClient.tenant.findMany({
      include: { config: true },
    });

    console.log(`Step 2: Processing ${tenants.length} tenants...`);

    for (const tenant of tenants) {
      if (!tenant.config) continue;

      const config = tenant.config;
      const tenantUrl = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.dbName}`;

      console.log(`\n[Tenant: ${tenant.code}]`);

      try {
        // A. Generate "Down" SQL using prisma migrate diff
        // Compares the current Tenant DB to the migrations history (minus the last one)
        const revertSql = execSync(
          `npx prisma migrate diff --from-url "${tenantUrl}" --to-migrations "${tempMigrationsDir}" --shadow-database-url "${shadowDbUrl}" --script`,
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
        );

        if (revertSql && revertSql.trim().length > 0 && !revertSql.includes('-- This is an empty diff')) {
          console.log(`  Physical changes detected. Applying revert SQL...`);
          
          const tempClient = new TenantClient({ datasources: { db: { url: tenantUrl } } });
          
          // Split and execute statements
          const statements = revertSql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));
          for (const statement of statements) {
            await tempClient.$executeRawUnsafe(statement);
          }
          await tempClient.$disconnect();
          console.log(`  Database structure reverted.`);
        } else {
          console.log(`  No physical structural changes needed to revert.`);
        }

        // B. Remove the migration record from _prisma_migrations
        const cleanupClient = new TenantClient({ datasources: { db: { url: tenantUrl } } });
        await cleanupClient.$executeRawUnsafe(
          `DELETE FROM _prisma_migrations WHERE migration_name = '${lastMigrationName}'`
        );
        await cleanupClient.$disconnect();
        console.log(`  Prisma migration record removed.`);

      } catch (error: any) {
        console.error(`  Error reverting ${tenant.code}:`, error.message);
      }
    }

    // 4. Cleanup Filesystem
    console.log(`\nStep 3: Cleaning up filesystem...`);
    const lastMigrationPath = path.join(migrationsDir, lastMigrationName);
    if (fs.existsSync(lastMigrationPath)) {
      fs.rmSync(lastMigrationPath, { recursive: true, force: true });
      console.log(`Deleted migration folder: ${lastMigrationName}`);
    }
    if (fs.existsSync(tempMigrationsDir)) {
      fs.rmSync(tempMigrationsDir, { recursive: true, force: true });
    }

    console.log('\nRevert completed successfully for all tenants.');
    console.log('NOTE: You should now manually revert your schema.prisma file to match the database state.');

  } catch (err: any) {
    console.error('Revert failed:', err.message);
  } finally {
    await masterClient.$disconnect();
  }
}

revertLastMigration();
