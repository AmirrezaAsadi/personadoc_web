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
    // Google OAuth for production
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    // GitHub OAuth for production
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),

    // Credentials for local development testing
    ...(process.env.NODE_ENV === 'development' ? [
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

          // Test credentials for development
          const testUsers = [
            { id: "1", email: "test@example.com", password: "password123", name: "Test User" },
            { id: "2", email: "admin@test.com", password: "admin123", name: "Admin User" }
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
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
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
