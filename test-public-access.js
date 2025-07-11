const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPublicAccess() {
  try {
    // Get a public persona
    const publicPersona = await prisma.persona.findFirst({
      where: { isPublic: true },
      select: { id: true, name: true, createdBy: true, isPublic: true }
    });

    if (!publicPersona) {
      console.log('No public personas found');
      return;
    }

    console.log('Found public persona:', publicPersona);

    // Get a different user (not the creator)
    const differentUser = await prisma.user.findFirst({
      where: { id: { not: publicPersona.createdBy } },
      select: { id: true, email: true }
    });

    if (!differentUser) {
      console.log('No other users found to test with');
      return;
    }

    console.log('Testing access with user:', differentUser);

    // Test if the persona is accessible by checking our access logic
    const persona = await prisma.persona.findUnique({
      where: { id: publicPersona.id }
    });

    const isOwner = persona.createdBy === differentUser.id;
    const isPublic = persona.isPublic === true;
    const hasShareToken = persona.shareToken !== null;

    console.log('Access check results:');
    console.log('- Is owner:', isOwner);
    console.log('- Is public:', isPublic);
    console.log('- Has share token:', hasShareToken);
    console.log('- Can access:', isOwner || isPublic || hasShareToken);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPublicAccess();
