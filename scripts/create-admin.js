const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'amircincy@gmail.com';
    
    // Check if admin user exists
    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!user) {
      // Create the admin user
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Created admin user: ${user.email}`);
    } else {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Updated user to admin: ${user.email}`);
    }
    
    console.log(`Admin user details:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
