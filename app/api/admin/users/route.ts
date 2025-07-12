import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return false
  
  // Use raw query to check user role and active status
  const result = await prisma.$queryRaw<{role: string, isActive: boolean}[]>`
    SELECT role, "isActive" FROM "User" WHERE email = ${session.user.email}
  `
  
  if (result.length === 0) return false
  const user = result[0]
  return user.role === 'ADMIN' && user.isActive === true
}

export async function GET(req: NextRequest) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get basic user data first
    const users = await prisma.user.findMany({
      include: {
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

    // Get role and isActive data using raw query for all users
    const userRoles = await prisma.$queryRaw<{id: string, role: string, isActive: boolean}[]>`
      SELECT id, role, "isActive" FROM "User"
    `
    
    const roleMap = new Map(userRoles.map(u => [u.id, { role: u.role, isActive: u.isActive }]))

    // Transform data for response
    const usersWithStatus = users.map(user => {
      const roleData = roleMap.get(user.id)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        isActive: roleData?.isActive ?? true,
        role: roleData?.role?.toLowerCase() || 'user',
        personaCount: user._count.personas,
        lastActive: user.updatedAt.toISOString()
      }
    })

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
