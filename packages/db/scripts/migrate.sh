#!/bin/bash

# Redline Database Migration Script
echo "🗄️  Starting Redline database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm db:generate

# Run database migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Seed the database with sample data
echo "🌱 Seeding database with sample data..."
pnpm db:seed

echo "✅ Database migration completed successfully!"
echo ""
echo "🎉 Your Redline database is ready!"
echo "   - Open Prisma Studio: pnpm db:studio"
echo "   - Access pgAdmin: http://localhost:5050"
echo "" 