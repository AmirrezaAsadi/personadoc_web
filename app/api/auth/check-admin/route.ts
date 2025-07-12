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

    const isAdmin = session.user.email === 'amircincy@gmail.com'

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
