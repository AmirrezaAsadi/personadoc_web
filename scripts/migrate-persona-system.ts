import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migratePersonaSystem() {
  console.log('🚀 Starting persona system migration...')

  try {
    // Add default timeline events for existing personas
    const existingPersonas = await prisma.persona.findMany({
      include: {
        interactions: true,
      }
    })

    console.log(`📊 Found ${existingPersonas.length} existing personas`)

    for (const persona of existingPersonas) {
      // Create initial timeline event for persona creation
      const creationEvent = await prisma.timelineEvent.create({
        data: {
          personaId: persona.id,
          title: 'Persona Created',
          description: `${persona.name} was created`,
          eventType: 'milestone',
          eventDate: persona.createdAt,
          importance: 10,
          category: 'creation',
          color: '#22C55E',
          icon: 'user-plus',
          createdBy: persona.createdBy,
        }
      })

      // Create initial version for existing personas
      const initialVersion = await prisma.personaVersion.create({
        data: {
          personaId: persona.id,
          version: '1.0',
          name: `${persona.name} - Initial Version`,
          snapshot: {
            name: persona.name,
            age: persona.age,
            occupation: persona.occupation,
            location: persona.location,
            introduction: persona.introduction,
            personalityTraits: persona.personalityTraits,
            interests: persona.interests,
            gadgets: persona.gadgets,
            metadata: persona.metadata,
          },
          isActive: true,
          isDraft: false,
          notes: 'Initial version created during migration',
          createdBy: persona.createdBy,
        }
      })

      // Update persona to point to current version
      await prisma.persona.update({
        where: { id: persona.id },
        data: {
          currentVersion: initialVersion.version,
        }
      })

      // Create timeline events for interactions if they exist
      if (persona.interactions.length > 0) {
        const interactionEvents = persona.interactions.map((interaction, index) => ({
          personaId: persona.id,
          title: `Interaction ${index + 1}`,
          description: `Conversation with ${persona.name}`,
          eventType: 'interaction',
          eventDate: interaction.createdAt,
          interactionId: interaction.id,
          importance: 5,
          category: 'conversation',
          color: '#3B82F6',
          icon: 'message-circle',
          createdBy: interaction.userId,
        }))

        await prisma.timelineEvent.createMany({
          data: interactionEvents
        })
      }

      console.log(`✅ Migrated persona: ${persona.name}`)
    }

    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migratePersonaSystem()
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migratePersonaSystem }
