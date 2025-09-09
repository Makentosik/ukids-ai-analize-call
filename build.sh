#!/bin/bash
echo "🚀 Starting Vercel build..."

echo "📦 Installing dependencies..."
npm ci

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
