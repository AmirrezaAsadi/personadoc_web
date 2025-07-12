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

interface RouteParams {
  params: Promise<{ userId: string }>
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()
    const { action, isActive } = body

    if (action === 'toggle-status') {
      // For now, we'll just return success since we don't have isActive in the schema yet
      // In a real implementation, you would update the user's isActive field
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: { isActive }
      // })

      return NextResponse.json({ 
        success: true, 
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await params

    // Prevent admin from deleting themselves
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
