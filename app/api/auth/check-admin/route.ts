import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAdmin: false })
    }

    // Check user role using Prisma ORM
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        role: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const isAdmin = user.role === 'ADMIN'

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
