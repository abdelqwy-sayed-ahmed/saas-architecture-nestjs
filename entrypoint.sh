#!/bin/sh

echo "Waiting for DB..."
sleep 5

echo "Starting masterDB migrations..."
# npx prisma migrate deploy --schema prisma/master/schema.prisma
npm run migrate:master

echo "Running tenant migrations..."
npm run migrate:tenants

echo "Starting app..."
node build/src/main.js