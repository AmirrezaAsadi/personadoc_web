import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return false
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, isActive: true }
  })
  
  return user?.role === 'ADMIN' && user?.isActive === true
}

export async function GET(req: NextRequest) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            personas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for response
    const usersWithStatus = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      role: user.role.toLowerCase(),
      personaCount: user._count.personas,
      lastActive: user.updatedAt.toISOString()
    }))

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
