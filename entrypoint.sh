#!/bin/sh

echo "Waiting for DB..."

until nc -z $DB_HOST $DB_PORT; do
  sleep 2
done

echo "Running masterDB migrations..."
# npx prisma migrate deploy --schema prisma/master/schema.prisma
npm run migrate:master

echo "Running tenant migrations..."
npm run migrate:tenants

echo "Starting app..."
node build/src/main.js