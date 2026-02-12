# FitApp — Workout & Cycling Tracker

A clean, mobile-first workout and cycling tracking web app built with Next.js. Designed for use on iPhone Safari during workouts and on desktop for planning and reviewing data.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn-inspired components
- **Database:** PostgreSQL via Prisma ORM
- **Validation:** Zod
- **Deployment:** Vercel

## Features (v1)

- **Dashboard** — Quick start workout, view scheduled sessions, recent history
- **Exercises** — CRUD exercise library with tags, equipment, form cues
- **Workout Templates** — Build programs with reps-based, timed hold, and interval blocks
- **Calendar** — Week view with schedule, move, skip, and start actions
- **Workout Logger** — Mobile-first set logging with weight/reps, failure tracking, rest timers, and "last time" data
- **Cycling Rides** — Import .fit files with summary extraction (duration, HR, power, cadence)
- **Insights** — Exercise strength trends, weekly consistency, cycling summary
- **Settings** — Account info, data links, AI coaching placeholder

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fitapp?schema=public"
```

See `.env.example` for reference.

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed the database with sample exercises and templates
npx prisma db seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

```bash
# Push schema changes without migration (dev)
npx prisma db push

# Run migrations
npx prisma migrate dev

# Seed data
npx prisma db seed

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add the `DATABASE_URL` environment variable (use a managed Postgres like Neon, Supabase, or Vercel Postgres)
4. Deploy

Vercel will automatically run `npx prisma generate` via the `postinstall` script.

After the first deploy, run the seed via the Vercel CLI or connect to your database directly:

```bash
DATABASE_URL="your-production-url" npx prisma db seed
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/page.tsx    # Home/Dashboard
│   ├── exercises/              # Exercise library
│   ├── templates/              # Workout templates (CRUD)
│   ├── calendar/               # Week calendar view
│   ├── workout/[id]/           # Active workout logger
│   ├── rides/                  # Cycling rides import
│   ├── insights/               # Trends and analytics
│   ├── settings/               # App settings
│   └── api/                    # API route handlers
│       ├── exercises/
│       ├── templates/
│       ├── calendar/
│       ├── workouts/
│       ├── rides/
│       └── insights/
├── components/
│   ├── ui/                     # Base UI components (button, card, input, etc.)
│   ├── layout/                 # Layout components (bottom-nav, page-header)
│   ├── template-form.tsx       # Shared template editor
│   ├── timer-widget.tsx        # Countdown/interval/rest timer
│   └── empty-state.tsx         # Empty state placeholder
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── utils.ts                # Utility functions
│   ├── services/               # Business logic layer
│   │   ├── workoutService.ts   # Exercises, templates, sessions
│   │   ├── calendarService.ts  # Schedule management
│   │   ├── rideImportService.ts # .fit file parsing + import
│   │   ├── insightService.ts   # Analytics computations
│   │   └── coachService.ts     # AI coaching stubs (TODO)
│   ├── validators/             # Zod schemas
│   └── hooks/                  # React hooks (useFetch)
├── types/                      # TypeScript interfaces
└── prisma/
    ├── schema.prisma           # Database schema
    └── seed.ts                 # Seed data
```

## Architecture Notes

### Service Layer

All business logic lives in `src/lib/services/`. Each service has a clear interface that can be extended:

- `workoutService` — exercises, templates, sessions, history
- `calendarService` — scheduling, moving, completing workouts
- `rideImportService` — .fit parsing, file storage, deduplication
- `insightService` — trend calculations, consistency metrics
- `coachService` — **AI coaching stubs** (not implemented in v1)

### AI Coaching Hooks

The `coachService` defines the interface for future AI integration. TODO markers exist throughout the codebase at integration points:

- Weight progression suggestions during workouts
- Warm-up recommendations before sessions
- Post-workout analysis and feedback
- Schedule optimization
- Cycling ride analysis

### File Storage

.fit file uploads use a local storage provider (`/uploads/`). The `rideImportService.storage` interface is abstracted for future S3/R2 migration.

### Auth

v1 runs in single-user mode with a hardcoded default user. The `User` model and user-scoped queries are already in place for adding authentication later.
