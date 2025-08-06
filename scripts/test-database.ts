import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test user count
    const userCount = await prisma.user.count()
    console.log(`👥 Total users: ${userCount}`)
    
    // Test if our target user exists
    const user = await prisma.user.findUnique({
      where: { email: 'amircincy@gmail.com' }
    })
    
    if (user) {
      console.log(`✅ Found user: ${user.email} (${user.id})`)
      
      // Test persona count for this user
      const personaCount = await prisma.persona.count({
        where: { createdBy: user.id }
      })
      console.log(`🎭 User's personas: ${personaCount}`)
      
      // List first 5 personas
      const personas = await prisma.persona.findMany({
        where: { createdBy: user.id },
        take: 5,
        select: {
          id: true,
          name: true,
          personalityTraits: true
        }
      })
      
      console.log('\n📋 First 5 personas:')
      personas.forEach((persona, index) => {
        const traits = Array.isArray(persona.personalityTraits) 
          ? persona.personalityTraits 
          : (typeof persona.personalityTraits === 'string' ? 'STRING_FORMAT' : 'UNKNOWN_FORMAT')
        console.log(`  ${index + 1}. ${persona.name} (${persona.id}) - Traits: ${Array.isArray(traits) ? traits.length + ' items' : traits}`)
      })
      
    } else {
      console.log('❌ User amircincy@gmail.com not found')
    }
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

testDatabase()
