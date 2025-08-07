import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupAndCreateExamples() {
  try {
    console.log('🔍 Finding user amircincy@gmail.com...')
    
    const user = await prisma.user.findUnique({
      where: { email: 'amircincy@gmail.com' }
    })

    if (!user) {
      console.error('❌ User amircincy@gmail.com not found')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.email} (${user.id})`)

    // 1. Clean up only the broken example personas (don't touch user's good personas)
    console.log('🧹 Cleaning up broken example personas...')
    
    // Only delete personas that have the example IDs
    const brokenExamples = await prisma.persona.deleteMany({
      where: {
        id: {
          in: [
            'example-busy-parent',
            'example-tech-student', 
            'example-senior-user',
            'example-business-pro',
            'example-creative-pro'
          ]
        }
      }
    })

    console.log(`🗑️  Cleaned up ${brokenExamples.count} broken example personas`)

    // 2. Create new example personas with proper JSON array format
    console.log('🎭 Creating example personas...')

    const examplePersonas = [
      {
        id: 'example-busy-parent',
        name: 'Sarah Chen',
        age: 34,
        occupation: 'Marketing Manager & Mom',
        location: 'Seattle, WA',
        personalityTraits: ['Efficient', 'Multitasking', 'Impatient with slow processes', 'Values family time', 'Tech-savvy but prefers simple interfaces'],
        interests: ['Family activities', 'Quick meal prep', 'Productivity tools', 'Online shopping'],
        gadgets: ['iPhone', 'Apple Watch', 'MacBook Air', 'AirPods'],
        tags: ['Parent', 'Working Mom', 'Time-conscious', 'Mobile-first'],
        introduction: 'Working mother of two young kids who needs to get things done quickly while juggling multiple responsibilities. Uses collaboration tools for quick reviews and urgent feedback during brief breaks.',
        isPublic: false,
        createdBy: user.id
      },
      {
        id: 'example-tech-student',
        name: 'Alex Rivera',
        age: 21,
        occupation: 'Computer Science Student',
        location: 'Austin, TX',
        personalityTraits: ['Curious', 'Detail-oriented', 'Price-conscious', 'Loves customization', 'Early adopter of technology'],
        interests: ['Gaming', 'Coding', 'Social media', 'Finding deals and discounts', 'Tech reviews'],
        gadgets: ['Gaming PC', 'Mechanical keyboard', 'Multiple monitors', 'Smartphone', 'Wireless headphones'],
        tags: ['Student', 'Tech-savvy', 'Budget-conscious', 'Gamer'],
        introduction: 'College student who is very tech-savvy but budget-conscious, always looking for the best deals and ways to optimize systems. Power user who tests edge cases in collaborative software.',
        isPublic: false,
        createdBy: user.id
      },
      {
        id: 'example-senior-user',
        name: 'Robert Thompson',
        age: 68,
        occupation: 'Retired Teacher',
        location: 'Portland, OR',
        personalityTraits: ['Cautious', 'Prefers step-by-step guidance', 'Values reliability', 'Concerned about security', 'Methodical'],
        interests: ['Reading', 'Gardening', 'Spending time with grandchildren', 'Learning new technologies slowly'],
        gadgets: ['iPad', 'Reading glasses', 'Simple smartphone', 'Desktop computer'],
        tags: ['Senior', 'Retired', 'Cautious', 'Methodical'],
        introduction: 'Retired educator who is learning to use digital systems, prefers clear instructions and confirmation at each step. Needs strong awareness features to understand what others are doing in collaborative tools.',
        isPublic: false,
        createdBy: user.id
      },
      {
        id: 'example-business-pro',
        name: 'Maria Gonzalez',
        age: 42,
        occupation: 'Operations Director',
        location: 'Chicago, IL',
        personalityTraits: ['Results-oriented', 'Data-driven', 'Values efficiency', 'Expects professional interfaces', 'Time-conscious'],
        interests: ['Business analytics', 'Process optimization', 'Team management', 'Professional development'],
        gadgets: ['MacBook Pro', 'iPhone', 'iPad Pro', 'Apple Pencil', 'Wireless mouse'],
        tags: ['Business', 'Executive', 'Data-driven', 'Professional'],
        introduction: 'Senior business professional who needs tools that integrate well with enterprise systems and provide detailed reporting. Manages collaborative workflows and coordinates team projects.',
        isPublic: false,
        createdBy: user.id
      },
      {
        id: 'example-creative-pro',
        name: 'Jordan Kim',
        age: 28,
        occupation: 'UX Designer',
        location: 'San Francisco, CA',
        personalityTraits: ['Creative', 'Aesthetic-focused', 'Values intuitive design', 'Collaborative', 'Detail-oriented about visual elements'],
        interests: ['Design trends', 'User research', 'Creative tools', 'Art galleries', 'Design communities'],
        gadgets: ['MacBook Pro', 'iPad Pro', 'Apple Pencil', 'Wacom tablet', 'High-res monitor'],
        tags: ['Designer', 'Creative', 'UX/UI', 'Visual'],
        introduction: 'UX designer who evaluates systems from both user experience and visual design perspectives, highly sensitive to design flaws. Specializes in collaboration UX and awareness design.',
        isPublic: false,
        createdBy: user.id
      }
    ];

    // Create personas
    for (const personaData of examplePersonas) {
      const persona = await prisma.persona.create({
        data: personaData
      })
      console.log(`✅ Created: ${persona.name} (${persona.id})`)
    }

    console.log('🎉 Successfully created all example personas!')
    
    // 3. Verify the personas are properly formatted
    console.log('🔍 Verifying persona data format...')
    const createdPersonas = await prisma.persona.findMany({
      where: {
        id: {
          in: examplePersonas.map(p => p.id)
        }
      }
    })

    for (const persona of createdPersonas) {
      console.log(`\n📋 ${persona.name}:`)
      try {
        const traits = Array.isArray(persona.personalityTraits) ? persona.personalityTraits : JSON.parse(String(persona.personalityTraits || '[]'))
        const interests = Array.isArray(persona.interests) ? persona.interests : JSON.parse(String(persona.interests || '[]'))
        console.log(`  ✅ Personality Traits: ${traits.length} items`)
        console.log(`  ✅ Interests: ${interests.length} items`)
      } catch (e) {
        console.log(`  ❌ JSON parsing error for ${persona.name}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAndCreateExamples()
