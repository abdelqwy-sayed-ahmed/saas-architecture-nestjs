import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const migrationName = process.argv[2] || 'init';
const baseDbUrl = process.env.MASTER_DATABASE_URL;
const migrationDir = path.join(__dirname, '../prisma/master/migrations');

if (!baseDbUrl) {
  console.error('MASTER_DATABASE_URL not found in .env');
  process.exit(1);
}

// Ensure the migration directory exists
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
}

try {
  console.log(`Generating Master Migration: ${migrationName}...`);
  console.log(`Target Directory: prisma/master/migrations`);
  
  execSync(`npx prisma migrate dev --name ${migrationName} --schema prisma/master/schema.prisma --create-only`, {
    env: { ...process.env, DATABASE_URL: baseDbUrl },
    stdio: 'inherit',
  });
  
  console.log('Master migration generated successfully in prisma/master/migrations.');
} catch (error: any) {
  console.error('Failed to generate master migration:', error.message);
}
