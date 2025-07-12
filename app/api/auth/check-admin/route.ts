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

    // Use raw query to check user role and active status
    const result = await prisma.$queryRaw<{role: string, isActive: boolean}[]>`
      SELECT role, "isActive" FROM "User" WHERE email = ${session.user.email}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const user = result[0]
    const isAdmin = user.role === 'ADMIN' && user.isActive === true

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
