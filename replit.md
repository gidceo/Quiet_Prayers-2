# QuietPrayers

## Overview

QuietPrayers is a spiritual web application that provides a peaceful, communal space for sharing and supporting prayer requests. The platform features a calming aesthetic with cloud imagery, daily inspirational content, and interactive prayer cards that users can bookmark and "lift up" in support. Built with modern web technologies, it emphasizes simplicity, reverence, and community engagement while maintaining content moderation standards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Shadcn/ui component library with Radix UI primitives for accessible, composable UI components
- Tailwind CSS for utility-first styling with custom design tokens

**Design System:**
- Custom color system using HSL values with CSS variables for theming
- "New York" style variant of Shadcn components
- Spiritual, calming aesthetic with soft gradients and peaceful cloud imagery
- Responsive design with mobile-first approach
- Custom elevation system for depth and visual hierarchy

**Component Structure:**
- `CloudHeader`: Full-width hero section with peaceful cloud image and app branding
- `DailyInspiration`: Centered card displaying rotating inspirational quotes/verses
- `PrayerCard`: Interactive cards with bookmark, "lift up", and share functionality
- `PrayerForm`: Form for submitting new prayer requests with validation and moderation

**State Management:**
- React Query for server state (prayers, bookmarks, lift-ups, daily inspiration)
- Local storage-based session management for anonymous user tracking
- Form state managed via React Hook Form with Zod schema validation

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for type-safe database operations
- Neon serverless PostgreSQL database
- Session-based user tracking without authentication

**API Design:**
- RESTful endpoints following resource-based patterns
- JSON request/response format
- Session ID passed via query parameters for anonymous user actions
- Validation using Zod schemas shared between frontend and backend

**Content Moderation:**
- Custom profanity filter checking prayer content and author names
- Pre-defined inappropriate word list
- Validation occurs before database persistence
- Returns user-friendly error messages on moderation failures

**Data Models:**
- `prayers`: Core prayer request data with content, author info, and lift-up counts
- `bookmarks`: User-prayer relationship tracking for saved prayers
- `liftUps`: User-prayer relationship tracking for prayer support
- `dailyInspirations`: Curated inspirational content with attribution

### Storage Layer

**Database Strategy:**
- PostgreSQL as primary database via Neon serverless platform
- Drizzle ORM provides type-safe query building and migrations
- In-memory storage implementation (`MemStorage`) for development/testing with seeded data
- Database abstraction through `IStorage` interface enables swapping implementations

**Schema Design:**
- UUID primary keys for all tables
- Foreign key relationships with cascade deletes for data integrity
- Timestamps for creation tracking
- Boolean flags for moderation and anonymity settings

### External Dependencies

**UI Component Library:**
- Radix UI primitives for accessible, unstyled components (Dialog, Dropdown, Popover, etc.)
- Shadcn/ui for pre-styled component implementations
- Lucide React for consistent icon system

**Utility Libraries:**
- `date-fns` for date formatting and relative time calculations
- `html2canvas` for generating shareable prayer card images
- `bad-words` package available but custom moderation implementation used
- `class-variance-authority` and `clsx` for conditional className management

**Build Tools:**
- Vite with React plugin for fast development and optimized production builds
- PostCSS with Tailwind and Autoprefixer for CSS processing
- ESBuild for server-side code bundling
- TypeScript compiler for type checking

**Development Tools:**
- Replit-specific plugins for development environment integration
- Runtime error overlay for improved debugging experience
- Cartographer and dev banner plugins for Replit IDE integration

**Database & ORM:**
- `@neondatabase/serverless` for PostgreSQL connection
- Drizzle ORM and Drizzle Kit for schema management and migrations
- `connect-pg-simple` for session store implementation (installed but not actively used)

**Form & Validation:**
- React Hook Form for form state management
- Zod for schema validation with Drizzle integration via `drizzle-zod`
- `@hookform/resolvers` for connecting validation to forms