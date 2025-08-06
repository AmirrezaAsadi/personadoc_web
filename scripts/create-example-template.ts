import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createExampleTemplate() {
  try {
    console.log('🚀 Creating built-in example template...');

    // First, find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'amircincy@gmail.com' }
    });

    if (!adminUser) {
      throw new Error('Admin user amircincy@gmail.com not found. Please make sure you are logged in first.');
    }

    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})`);

    // 1. Create Example Personas
    const personas = await Promise.all([
      // Busy Parent - Sarah
      prisma.persona.upsert({
        where: { id: 'example-busy-parent' },
        update: {},
        create: {
          id: 'example-busy-parent',
          name: 'Sarah Chen',
          age: 34,
          occupation: 'Marketing Manager & Mom',
          location: 'Seattle, WA',
          personalityTraits: ['Efficient', 'Multitasking', 'Impatient with slow processes', 'Values family time', 'Tech-savvy but prefers simple interfaces'],
          interests: ['Family activities', 'Quick meal prep', 'Productivity tools', 'Online shopping'],
          gadgets: ['iPhone', 'Apple Watch', 'MacBook Air', 'AirPods'],
          tags: ['Parent', 'Working Mom', 'Time-conscious', 'Mobile-first'],
          introduction: 'Working mother of two young kids who needs to get things done quickly while juggling multiple responsibilities',
          isPublic: true,
          createdBy: adminUser.id,
        }
      }),

      // Tech-Savvy Student - Alex
      prisma.persona.upsert({
        where: { id: 'example-tech-student' },
        update: {},
        create: {
          id: 'example-tech-student',
          name: 'Alex Rivera',
          age: 21,
          occupation: 'Computer Science Student',
          location: 'Austin, TX',
          personalityTraits: ['Curious', 'Detail-oriented', 'Price-conscious', 'Loves customization', 'Early adopter of technology'],
          interests: ['Gaming', 'Coding', 'Social media', 'Finding deals and discounts', 'Tech reviews'],
          gadgets: ['Gaming PC', 'Mechanical keyboard', 'Multiple monitors', 'Smartphone', 'Wireless headphones'],
          tags: ['Student', 'Tech-savvy', 'Budget-conscious', 'Gamer'],
          introduction: 'College student who is very tech-savvy but budget-conscious, always looking for the best deals and ways to optimize systems',
          isPublic: true,
          createdBy: adminUser.id
        }
      }),

      // Senior User - Robert
      prisma.persona.upsert({
        where: { id: 'example-senior-user' },
        update: {},
        create: {
          id: 'example-senior-user',
          name: 'Robert Thompson',
          age: 68,
          occupation: 'Retired Teacher',
          location: 'Portland, OR',
          personalityTraits: ['Cautious', 'Prefers step-by-step guidance', 'Values reliability', 'Concerned about security', 'Methodical'],
          interests: ['Reading', 'Gardening', 'Spending time with grandchildren', 'Learning new technologies slowly'],
          gadgets: ['iPad', 'Reading glasses', 'Simple smartphone', 'Desktop computer'],
          tags: ['Senior', 'Retired', 'Cautious', 'Methodical'],
          introduction: 'Retired educator who is learning to use digital systems, prefers clear instructions and confirmation at each step',
          isPublic: true,
          createdBy: adminUser.id
        }
      }),

      // Business Professional - Maria
      prisma.persona.upsert({
        where: { id: 'example-business-pro' },
        update: {},
        create: {
          id: 'example-business-pro',
          name: 'Maria Gonzalez',
          age: 42,
          occupation: 'Operations Director',
          location: 'Chicago, IL',
          personalityTraits: ['Results-oriented', 'Data-driven', 'Values efficiency', 'Expects professional interfaces', 'Time-conscious'],
          interests: ['Business analytics', 'Process optimization', 'Team management', 'Professional development'],
          gadgets: ['MacBook Pro', 'iPhone', 'iPad Pro', 'Apple Pencil', 'Wireless mouse'],
          tags: ['Business', 'Executive', 'Data-driven', 'Professional'],
          introduction: 'Senior business professional who needs tools that integrate well with enterprise systems and provide detailed reporting',
          isPublic: true,
          createdBy: adminUser.id
        }
      }),

      // Creative Professional - Jordan
      prisma.persona.upsert({
        where: { id: 'example-creative-pro' },
        update: {},
        create: {
          id: 'example-creative-pro',
          name: 'Jordan Kim',
          age: 28,
          occupation: 'UX Designer',
          location: 'San Francisco, CA',
          personalityTraits: ['Creative', 'Aesthetic-focused', 'Values intuitive design', 'Collaborative', 'Detail-oriented about visual elements'],
          interests: ['Design trends', 'User research', 'Creative tools', 'Art galleries', 'Design communities'],
          gadgets: ['MacBook Pro', 'iPad Pro', 'Apple Pencil', 'Wacom tablet', 'High-res monitor'],
          tags: ['Designer', 'Creative', 'UX/UI', 'Visual'],
          introduction: 'UX designer who evaluates systems from both user experience and visual design perspectives, highly sensitive to design flaws',
          isPublic: true,
          createdBy: adminUser.id
        }
      })
    ]);

    console.log(`✅ Created ${personas.length} example personas`);

    return personas;
  } catch (error) {
    console.error('❌ Error creating example template:', error);
    throw error;
  }
}

async function main() {
  await createExampleTemplate();
  console.log('🎉 Example template created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { createExampleTemplate };
