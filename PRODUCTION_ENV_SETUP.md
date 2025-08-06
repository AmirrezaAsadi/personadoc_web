# Production Environment Variables Setup

## Required Vercel Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and set:

### Core NextAuth Configuration
```
NEXTAUTH_URL=https://www.personadock.com
NEXTAUTH_SECRET=your-super-secret-production-key-here-make-it-long-and-random
```

### OAuth Provider Setup

#### Google OAuth (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://www.personadock.com/api/auth/callback/google`
6. Set these variables:
```
GOOGLE_CLIENT_ID=your-real-google-client-id
GOOGLE_CLIENT_SECRET=your-real-google-client-secret
```

#### GitHub OAuth (Required)
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL: `https://www.personadock.com/api/auth/callback/github`
4. Set these variables:
```
GITHUB_ID=your-real-github-client-id
GITHUB_SECRET=your-real-github-client-secret
```

### Other Required Variables
```
DATABASE_URL=your-production-database-url
OPENAI_API_KEY=your-openai-or-grok-api-key
OPENAI_BASE_URL=https://api.x.ai/v1
OPENAI_EMBEDDINGS_API_KEY=your-openai-embeddings-key
PINECONE_API_KEY=your-pinecone-api-key
```

## Immediate Fix

For a quick fix to stop the callback error, you can temporarily disable OAuth providers and use only credentials provider by setting:

```
NODE_ENV=development
```

This will enable the credentials provider with test accounts:
- Email: test@example.com | Password: password123
- Email: admin@test.com | Password: admin123

But this is NOT recommended for production!
