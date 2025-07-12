const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    const adminEmail = 'amircincy@gmail.com';
    
    // First, check if user exists
    let user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!user) {
      // Create the user if they don't exist
      console.log(`Creating user ${adminEmail}...`);
      user = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Created admin user: ${adminEmail}`);
    } else {
      // Update existing user to admin
      console.log(`Updating existing user ${adminEmail} to admin...`);
      user = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'ADMIN',
          isActive: true
        }
      });
      console.log(`✅ Updated user ${adminEmail} to admin role`);
    }

    // Verify the change
    const verifyUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { email: true, role: true, isActive: true }
    });

    console.log(`\n📋 User details:`);
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Role: ${verifyUser.role}`);
    console.log(`   Active: ${verifyUser.isActive}`);

  } catch (error) {
    console.error('❌ Error setting admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
