import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    
    // Email/Password for local testing
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { 
          label: "Email", 
          type: "email", 
          placeholder: "test@example.com" 
        },
        password: { 
          label: "Password", 
          type: "password" 
        }
      },
      async authorize(credentials) {
        // For local testing - hardcoded credentials
        if (process.env.NODE_ENV === 'development') {
          if (
            credentials?.email === "test@example.com" && 
            credentials?.password === "password123"
          ) {
            return {
              id: "local-test-user",
              email: "test@example.com",
              name: "Test User",
              image: null,
            }
          }
          
          // Additional test users
          if (
            credentials?.email === "admin@test.com" && 
            credentials?.password === "admin123"
          ) {
            return {
              id: "local-admin-user",
              email: "admin@test.com",
              name: "Admin User",
              image: null,
            }
          }
        }
        
        // Return null if user data could not be retrieved
        return null
      }
    }),
  ],
  session: {
    strategy: process.env.NODE_ENV === 'production' ? "database" : "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token, user }) {
      if (process.env.NODE_ENV === 'production') {
        // Database sessions - user is available
        if (session?.user && user) {
          (session.user as any).id = user.id
        }
      } else {
        // JWT sessions - use token
        if (session?.user && token?.id) {
          (session.user as any).id = token.id as string
        }
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
