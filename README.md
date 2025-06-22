# Redline - Car Enthusiast Social Platform

A full-stack social platform for car enthusiasts to create clubs, organize events, participate in challenges, and build their automotive community.

## 🚗 Project Overview

Redline is a Next.js-based platform that combines social networking with automotive culture. Users can create or join clubs, share posts, organize meetups, participate in challenges, and trade parts in the marketplace.

### Core Features

- **Club System**: Create public/private clubs with member management
- **Social Feed**: Share posts, photos, and updates with club members
- **Events**: Organize and attend club meetups and car shows
- **Challenges**: Participate in driving challenges with leaderboards
- **Marketplace**: Buy/sell car parts and accessories
- **User Profiles**: Track achievements, memberships, and activity

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **Payments**: Stripe (subscriptions), Coinbase Commerce (crypto)
- **File Storage**: AWS S3 / MinIO
- **Real-time**: Pusher
- **Monitoring**: Sentry
- **3D Models**: Three.js (car model viewer)

## 📦 Project Structure

```
redline/
├── packages/
│   ├── web/          # Next.js frontend application
│   ├── db/           # Prisma schema and database utilities
│   └── shared/       # Shared types and utilities
├── public/           # Static assets
└── turbo.json        # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL database
- Clerk account for authentication
- Optional: Stripe account, AWS S3/MinIO for file storage

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd redline
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment sample:
```bash
cp env.sample .env
```

4. Configure your `.env` file with:
   - Database connection string
   - Clerk API keys
   - Stripe keys (optional)
   - S3/MinIO credentials (optional)

### Database Setup

1. Create the database:
```bash
createdb redline
```

2. Run migrations:
```bash
pnpm db:migrate
```

3. (Optional) Seed the database:
```bash
pnpm db:seed
```

### Development

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 🏗️ Architecture

### Authentication Flow

1. User signs up/in via Clerk
2. Webhook creates/updates user in our database
3. tRPC context resolves Clerk ID to database user
4. All API calls include user context

### Data Model Highlights

- **Users**: Synced from Clerk, includes site roles (USER, ADMIN, SUPER_ADMIN)
- **Clubs**: Can be public/private, support member roles
- **Posts**: Support comments, likes, and nested replies
- **Events**: Include attendance tracking
- **Challenges**: Support different types with leaderboards

### Security

- Role-based access control (RBAC) for clubs and site administration
- Rate limiting on sensitive endpoints
- Audit logging for important actions
- Input validation with Zod schemas

## 📝 Development Notes

### Current State

The codebase has been cleaned up and documented for handoff. Key areas that are production-ready:

- ✅ Authentication and user management
- ✅ Club creation and management
- ✅ Post creation and interactions
- ✅ Basic event system
- ✅ Member management and permissions

### Areas Needing Work

1. **Image Uploads**: Currently using URL inputs, needs proper file upload
2. **Real-time Updates**: Pusher integration started but not completed
3. **Marketplace**: Basic structure exists, needs payment integration
4. **Challenges**: Data model exists, UI needs implementation
5. **Notifications**: System design needed for club activities
6. **Search**: Full-text search for posts and clubs

### Code Quality TODOs

- Add comprehensive test coverage
- Implement proper error boundaries
- Add loading skeletons for better UX
- Optimize database queries with proper indexes
- Add data validation for all user inputs
- Implement proper caching strategy

### Security TODOs

- Implement CSRF protection
- Add API rate limiting per user
- Set up proper CORS configuration
- Add request signing for webhooks
- Implement session management
- Add IP-based blocking for abuse

## 🧪 Testing

Currently, the project lacks automated tests. Priority areas for testing:

1. Authentication flows
2. Permission checks
3. API endpoints
4. Database operations
5. UI components

## 🚢 Deployment

The application is designed to be deployed on:

- **Frontend**: Vercel (recommended) or any Node.js host
- **Database**: Supabase, Neon, or any PostgreSQL provider
- **File Storage**: AWS S3, Cloudflare R2, or MinIO

### Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure Clerk production keys
- [ ] Set up database backups
- [ ] Configure Sentry for error tracking
- [ ] Set up monitoring and alerts
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure CDN for static assets

## 📚 API Documentation

The API is built with tRPC, providing type-safe endpoints. Key routers:

- `/api/trpc/club.*` - Club management
- `/api/trpc/clubPost.*` - Posts and comments
- `/api/trpc/clubEvent.*` - Event management
- `/api/trpc/user.*` - User operations
- `/api/trpc/challenge.*` - Challenge system

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure code passes linting
4. Submit a pull request

## 📄 License

This project is private and proprietary.

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm type-check

# Format code
pnpm format
```

## 🆘 Troubleshooting

### Common Issues

1. **Database connection errors**: Check your DATABASE_URL in .env
2. **Clerk authentication issues**: Verify your Clerk keys are correct
3. **Build errors**: Try `pnpm clean` and rebuild
4. **Type errors**: Run `pnpm type-check` to identify issues

### Support

For questions or issues, please check the codebase documentation or create an issue in the repository.

## 🚀 Events & Challenges System

The Events & Challenges feature allows clubs to host events, sell tickets, and run skill-based challenges with entry fees and bonus prize pools.

### Testing the API Routes Locally

1. **First, run database migrations to create the new tables:**
   ```bash
   cd packages/db
   npx prisma migrate dev --name add_events_challenges
   ```

2. **Generate Prisma Client with new models:**
   ```bash
   npx prisma generate
   ```

3. **Test creating an event (requires club admin role):**
   ```bash
   # Create event without challenges
   curl -X POST http://localhost:3000/api/events/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-clerk-token>" \
     -d '{
       "title": "Summer Car Meet 2024",
       "description": "Annual summer gathering",
       "location": "Downtown Parking Garage",
       "startDateTime": "2024-07-01T10:00:00Z",
       "endDateTime": "2024-07-01T16:00:00Z",
       "isPublic": true,
       "entryFeeUSD": 25,
       "maxAttendees": 200,
       "clubId": "<your-club-id>"
     }'

   # Create event with challenges (requires premium club)
   curl -X POST http://localhost:3000/api/events/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-clerk-token>" \
     -d '{
       "title": "Street Performance Challenge",
       "description": "Test your skills",
       "location": "Industrial District",
       "startDateTime": "2024-08-15T09:00:00Z",
       "endDateTime": "2024-08-15T18:00:00Z",
       "isPublic": false,
       "entryFeeUSD": 50,
       "maxAttendees": 100,
       "clubId": "<your-club-id>",
       "challenges": [
         {
           "title": "0-60 Time Attack",
           "description": "Fastest acceleration wins",
           "entryFeeUSD": 20,
           "bonusPoolPercentOfEventFees": 25
         }
       ]
     }'
   ```

4. **Register for an event:**
   ```bash
   curl -X POST http://localhost:3000/api/events/<event-id>/register \
     -H "Authorization: Bearer <your-clerk-token>"
   ```

5. **Enter a challenge (must be registered for event first):**
   ```bash
   curl -X POST http://localhost:3000/api/challenges/<challenge-id>/enter \
     -H "Authorization: Bearer <your-clerk-token>"
   ```

6. **Complete a challenge and set winners (club admin only):**
   ```bash
   curl -X POST http://localhost:3000/api/challenges/<challenge-id>/complete \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-clerk-token>" \
     -d '{
       "firstPlaceUserId": "<user-id-1>",
       "secondPlaceUserId": "<user-id-2>",
       "thirdPlaceUserId": "<user-id-3>"
     }'
   ```

### Important Notes

- **Payments**: Currently using placeholder payment intent IDs. Real Stripe integration needs to be implemented.
- **Premium Features**: Only clubs with `premium: true` can create events with challenges.
- **Bonus Pools**: Calculated as a percentage of total event entry fees. Winners receive 50% (1st), 30% (2nd), and 20% (3rd).
- **Authentication**: All routes require Clerk authentication token.

### Database Schema

The feature adds these new models:
- `Event`: Main event details with entry fees and attendance limits
- `Challenge`: Skill-based competitions within events  
- `EventEntry`: Tracks user registrations for events
- `ChallengeEntry`: Tracks user entries in challenges
