import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { PrismaClient as MasterClient } from '../src/prisma-client/master';

dotenv.config();

const baseDbUrl = process.env.MASTER_DATABASE_URL;

if (!baseDbUrl) {
  console.error('MASTER_DATABASE_URL not found in .env');
  process.exit(1);
}

async function migrate() {
  const masterClient = new MasterClient();

  try {
    //Fetch Tenants from Master
    const tenants = await masterClient.tenant.findMany({
      include: { config: true },
    });

    // 3. Migrate each Tenant DB
    for (const tenant of tenants) {
      if (!tenant.config) {
        console.warn(`Tenant ${tenant.code} has no config, skipping.`);
        continue;
      }

      const config = tenant.config;
      const dbUrl = `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.dbName}`;

      console.log(`Migrating Tenant Database: ${tenant.code} (${config.dbName})...`);
      
      try {
        execSync(`npx prisma migrate deploy --schema prisma/tenant/schema.prisma`, {
          env: {
            ...process.env,
            TENANT_DATABASE_URL: dbUrl, // Used by the schema
          },
          stdio: 'inherit',
        });
        console.log(`Successfully migrated ${tenant.code}`);
      } catch (error:any) {
        console.error(`Failed to migrate ${tenant.code}:`, error.message);
      }
    }
  } catch (err:any) {
    console.error('Migration failed:', err.message);
  } finally {
    await masterClient.$disconnect();
  }
}

migrate();
