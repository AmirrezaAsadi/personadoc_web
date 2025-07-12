const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log('📋 All users in database:\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            personas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Personas: ${user._count.personas}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      
      if (user.role === 'ADMIN') {
        console.log(`   🛡️  ADMIN USER`);
      }
      console.log('');
    });

    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const activeCount = users.filter(u => u.isActive).length;
    
    console.log(`📊 Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Active users: ${activeCount}`);
    console.log(`   Admin users: ${adminCount}`);

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();
