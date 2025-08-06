import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            personas: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log('\n=== USERS IN DATABASE ===')
    console.log('Total users:', users.length)
    console.log('\nUser Details:')
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Email: ${user.email}`)
      console.log(`   Name: ${user.name || 'No name set'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Personas: ${user._count.personas}`)
      console.log(`   Joined: ${user.createdAt.toISOString().split('T')[0]}`)
    })

    console.log('\n=== END USER LIST ===\n')
    
  } catch (error) {
    console.error('Error querying users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
