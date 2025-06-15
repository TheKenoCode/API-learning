# CarHub 🚗

A premium car marketplace built with modern web technologies, featuring 3D car viewing, secure escrow payments, and real-time events.

## Features

- **🔧 Modern Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **🔐 Authentication**: Clerk integration with secure user management
- **💳 Payments**: Stripe Connect (USD) + Coinbase Commerce (USDC)
- **🗄️ Database**: PostgreSQL with Prisma ORM
- **📡 API**: tRPC for type-safe API calls
- **🎮 3D Viewer**: React Three Fiber for interactive car models
- **⚡ Real-time**: Pusher for live updates
- **☁️ Storage**: S3-compatible storage with MinIO
- **🔒 Escrow**: Secure transaction handling
- **🏆 Events**: Car shows and contests with voting

## Architecture

```
CarHub (Turborepo + PNPM)
├── packages/
│   ├── web/        # Next.js 14 app with tRPC + Clerk
│   ├── db/         # Prisma schema + migrations
│   ├── shared/     # Zod schemas + utility types
│   └── infra/      # Docker Compose setup
├── .github/        # CI workflows
└── docs/           # Documentation
```

## Prerequisites

- **Node.js** 20+
- **PNPM** 8.15.0+
- **Docker** & **Docker Compose**
- **Git**

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url> carhub
cd carhub
pnpm install
```

### 2. Environment Setup

```bash
cp env.sample .env.local
# Edit .env.local with your actual API keys
```

### 3. Start Infrastructure

```bash
# Start Postgres, MinIO, and pgAdmin
docker compose -f packages/infra/docker-compose.yml up -d

# Verify services are running
docker compose -f packages/infra/docker-compose.yml ps
```

### 4. Database Setup

```bash
# Generate Prisma client
cd packages/db
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 5. Start Development

```bash
# Start all packages in dev mode
pnpm dev
```

🎉 **Open [http://localhost:3000](http://localhost:3000)**

## Services

| Service           | URL                   | Credentials                |
| ----------------- | --------------------- | -------------------------- |
| **Web App**       | http://localhost:3000 | -                          |
| **pgAdmin**       | http://localhost:5050 | admin@carhub.com / admin   |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin123 |
| **Postgres**      | localhost:5432        | postgres / postgres        |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check

# Database operations
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database
pnpm db:studio      # Open Prisma Studio
```

## Environment Variables

Key variables to configure:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/carhub"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Payments
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Storage (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"

# Real-time (Pusher)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
```

## Project Structure

```
packages/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── marketplace/       # Marketplace pages
│   ├── events/           # Events pages
│   ├── dashboard/        # User dashboard
│   ├── api/trpc/         # tRPC API routes
│   └── actions/          # Server actions
├── components/
│   ├── ui/               # shadcn/ui components
│   └── CarModelViewer.tsx # 3D car viewer
├── lib/
│   ├── trpc.tsx          # tRPC client setup
│   ├── db.ts             # Prisma client
│   ├── s3.ts             # S3 storage utils
│   └── payments.ts       # Payment helpers
└── server/api/           # tRPC server setup

packages/db/
├── prisma/
│   └── schema.prisma     # Database schema
├── seed.ts               # Database seeder
└── scripts/              # Migration scripts

packages/shared/
└── src/
    └── index.ts          # Zod schemas + types
```

## Key Features Implementation

### 🎮 3D Car Viewer

- React Three Fiber integration
- Interactive car model viewing
- Suspense-based loading
- Mobile-responsive controls

### 🔒 Secure Escrow

- Multi-step transaction flow
- Stripe payment integration
- Automated fund release
- Dispute resolution system

### 💰 Crypto Payments

- Coinbase Commerce integration
- USDC payment support
- Real-time payment tracking
- Multi-currency support

### 🏆 Events & Contests

- Real-time voting system
- Leaderboards and prizes
- Event management dashboard
- Social features

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## Technology Stack

**Frontend:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Three Fiber

**Backend:**

- tRPC
- Prisma ORM
- PostgreSQL
- Clerk Auth

**Infrastructure:**

- Docker Compose
- MinIO (S3-compatible)
- Pusher (WebSockets)
- Vercel (Deployment)

**Payments:**

- Stripe Connect
- Coinbase Commerce

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the CarHub team**
