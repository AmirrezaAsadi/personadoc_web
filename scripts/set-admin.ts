import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Update the admin user
    const adminEmail = 'amircincy@gmail.com'
    
    const updatedUser = await prisma.user.update({
      where: {
        email: adminEmail
      },
      data: {
        role: 'ADMIN'
      }
    })

    console.log('✅ Successfully updated user to admin:')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Name: ${updatedUser.name}`)
    console.log(`   Role: ${updatedUser.role}`)
    
    // Check all users and their roles
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log('\n=== ALL USERS AND THEIR ROLES ===')
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} - Role: ${user.role}`)
    })
    
  } catch (error) {
    console.error('Error updating user role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
