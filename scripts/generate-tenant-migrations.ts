import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const migrationName = process.argv[2] || 'init';
const baseDbUrl = process.env.TENANT_DATABASE_URL;
const migrationDir = path.join(__dirname, '../prisma/tenant/migrations');

if (!baseDbUrl) {
  console.error('TENANT_DATABASE_URL not found in .env');
  process.exit(1);
}

// Ensure the migration directory exists
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

try {
  console.log(`Generating Tenant Migration: ${migrationName}...`);
  console.log(`Target Directory: prisma/tenant/migrations`);
  
  execSync(`npx prisma migrate dev --name ${migrationName} --schema prisma/tenant/schema.prisma --create-only`, {
    env: { ...process.env, DATABASE_URL: baseDbUrl },
    stdio: 'inherit',
  });
  
  console.log('Tenant migration generated successfully in prisma/tenant/migrations.');
} catch (error: any) {
  console.error('Failed to generate tenant migration:', error.message);
}
