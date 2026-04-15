import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const baseDbUrl = process.env.MASTER_DATABASE_URL;

if (!baseDbUrl) {
  console.error('MASTER_DATABASE_URL not found in .env');
  process.exit(1);
}

async function migrate() {

  try {
    // 1. Migrate Master DB
    console.log('Migrating Master Database...');
    execSync(`npx prisma migrate deploy --schema prisma/master/schema.prisma`, {
      env: { ...process.env, DATABASE_URL: baseDbUrl },
      stdio: 'inherit',
    });

  } catch (err:any) {
    console.error('Migration failed:', err.message);
  }
}

migrate();
