import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Simple direct query to verify roles
    const result = await prisma.$queryRaw`
      SELECT email, name, role, "isActive" 
      FROM "User" 
      ORDER BY "createdAt" ASC
    `
    
    console.log('=== USER ROLES IN DATABASE ===')
    console.log(result)
    console.log('==============================')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
