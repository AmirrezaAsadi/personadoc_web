# PersonaDoc Authentication Guide

## Overview

PersonaDoc uses NextAuth.js for authentication, allowing users to sign in with Google or GitHub and have their own personal collection of AI personas. Each user can only see and interact with their own personas.

## Current Authentication Setup

### 1. NextAuth.js Configuration

The authentication is configured in `lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
}
```

### 2. Database Schema

The Prisma schema includes all necessary tables for NextAuth.js and user-specific personas:

- **User**: Stores user account information
- **Account**: OAuth account connections
- **Session**: User sessions
- **Persona**: User-created personas (linked to User via `createdBy`)
- **Interaction**: Chat history between users and personas

### 3. Protected API Routes

All API routes are protected and user-specific:

#### Persona Management (`/api/personas`)
- **GET**: Returns only personas created by the authenticated user
- **POST**: Creates personas associated with the authenticated user

#### Chat API (`/api/personas/[id]/chat`)
- **POST**: Only allows chatting with personas owned by the authenticated user
- Records interactions with the correct user ID

### 4. Frontend Authentication

The main page (`app/page.tsx`) handles authentication states:

- **Loading**: Shows spinner while checking authentication
- **Unauthenticated**: Shows sign-in buttons for Google/GitHub
- **Authenticated**: Shows the full PersonaDoc interface

```tsx
const { data: session, status } = useSession()

// Loading state
if (status === 'loading') {
  return <LoadingSpinner />
}

// Sign-in required
if (!session) {
  return <SignInPage />
}

// Authenticated user interface
return <PersonaDocInterface />
```

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Database
DATABASE_URL=your-postgresql-connection-string

# Grok AI
GROK_API_KEY=your-grok-api-key
```

## Setting Up OAuth Providers

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://your-domain.com/api/auth/callback/github` (production)

## User Flow

1. **First Visit**: User sees sign-in page with Google/GitHub options
2. **Authentication**: User clicks sign-in button → redirects to provider → returns with session
3. **User Creation**: If first time, user record is created in database
4. **Persona Management**: User can create and manage their own personas
5. **Chat**: User can chat with their personas, all interactions are recorded

## Security Features

- ✅ **Session-based authentication** using NextAuth.js
- ✅ **User isolation** - users only see their own personas
- ✅ **Protected API routes** - all require authentication
- ✅ **Database-level security** - queries filtered by user ID
- ✅ **OAuth integration** with trusted providers (Google, GitHub)

## Adding More Providers

To add additional OAuth providers (e.g., Discord, Twitter), update `lib/auth.ts`:

```typescript
import DiscordProvider from "next-auth/providers/discord"

export const authOptions = {
  // ...existing config
  providers: [
    // ...existing providers
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
}
```

## Development vs Production

### Development
- Uses `http://localhost:3000` for callbacks
- `.env.local` for environment variables
- Hot reload with authentication state preserved

### Production (Vercel)
- Environment variables set in Vercel dashboard
- HTTPS required for OAuth callbacks
- Automatic session management

## Testing Authentication

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000` (or the port shown in terminal)
3. Click "Sign in with Google" or "Sign in with GitHub"
4. Complete OAuth flow
5. Create a demo persona
6. Test chat functionality

The system ensures each user has their own isolated collection of personas and chat history.

## Troubleshooting

### Module not found: '@next-auth/prisma-adapter'

If you encounter this error, install the missing dependency:

```bash
npm install @next-auth/prisma-adapter
```

This package is required for NextAuth.js to work with Prisma as the database adapter.
