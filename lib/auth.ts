import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/signin',
  },
  providers: [
    // Google OAuth for production (only if credentials are properly configured)
    ...(process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID !== "your_google_client_id_here" ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    
    // GitHub OAuth for production (only if credentials are properly configured)
    ...(process.env.GITHUB_ID && 
        process.env.GITHUB_SECRET && 
        process.env.GITHUB_ID !== "your_github_client_id_here" ? [
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      })
    ] : []),

    // Credentials for local development testing OR production fallback if OAuth not configured
    ...(process.env.NODE_ENV === 'development' || 
        (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id_here") ? [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Test credentials for development and production fallback
          const testUsers = [
            { id: "1", email: "test@example.com", password: "password123", name: "Test User" },
            { id: "2", email: "admin@test.com", password: "admin123", name: "Admin User" },
            { id: "3", email: "amircincy@gmail.com", password: "admin123", name: "Amir Admin" }
          ]

          const user = testUsers.find(u => 
            u.email === credentials.email && u.password === credentials.password
          )

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          return null
        }
      })
    ] : [])
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle production domain
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${productionUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === new URL(productionUrl).origin) return url
      return productionUrl
    },
    session: async ({ session, user, token }) => {
      if (session?.user) {
        // For database strategy (production with OAuth), use the user.id from database
        if (user?.id) {
          (session.user as any).id = user.id
        }
        // For JWT strategy (development or credentials), use the token.sub (user id from JWT)
        else if (token?.sub) {
          (session.user as any).id = token.sub
        }
      }
      return session
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  session: {
    strategy: process.env.NODE_ENV === 'development' ? 'jwt' : 'database',
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
