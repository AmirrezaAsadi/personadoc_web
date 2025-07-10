import { prisma } from '@/lib/prisma'

async function initializeDatabase() {
  try {
    console.log('Initializing database...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // The tables should be created automatically by Prisma
    // Let's test by creating a sample user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    
    console.log('✅ Database tables are working:', testUser)
    
    await prisma.$disconnect()
    console.log('✅ Database initialization complete')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

initializeDatabase()
