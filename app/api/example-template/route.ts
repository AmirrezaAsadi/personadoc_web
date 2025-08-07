import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For credentials provider, use the session user ID directly
    let userId = (session.user as any).id

    // For OAuth providers, find user by email
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Define example personas data
    const examplePersonasData = [
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
        introduction: 'Working mother of two young kids who needs to get things done quickly while juggling multiple responsibilities',
        isPublic: false,
        createdBy: userId
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
        introduction: 'College student who is very tech-savvy but budget-conscious, always looking for the best deals and ways to optimize systems',
        isPublic: false,
        createdBy: userId
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
        introduction: 'Retired educator who is learning to use digital systems, prefers clear instructions and confirmation at each step',
        isPublic: false,
        createdBy: userId
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
        introduction: 'Senior business professional who needs tools that integrate well with enterprise systems and provide detailed reporting',
        isPublic: false,
        createdBy: userId
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
        introduction: 'UX designer who evaluates systems from both user experience and visual design perspectives, highly sensitive to design flaws',
        isPublic: false,
        createdBy: userId
      }
    ];

    // Create or update example personas
    const examplePersonas = await Promise.all(
      examplePersonasData.map(persona =>
        prisma.persona.upsert({
          where: { id: persona.id },
          update: persona,
          create: persona,
          select: {
            id: true,
            name: true,
            age: true,
            occupation: true,
            location: true,
            personalityTraits: true,
            interests: true,
            introduction: true
          }
        })
      )
    );

    // Create example workflow
    const exampleWorkflow = {
      id: `example-collaborative-document-${Date.now()}`,
      name: 'Collaborative Document Editing System',
      description: 'Multi-user document collaboration with real-time editing, comments, and version control',
      collaborationType: 'parallel' as const,
      swimLanes: [
        {
          id: `lane-system-${Date.now()}`,
          name: 'System Coordinator',
          personaId: 'system-agent',
          color: '#6366F1',
          description: 'System that manages collaboration, conflicts, and user interactions',
          actions: [
            {
              id: `action-system-1-${Date.now()}`,
              title: 'Initialize Collaborative Session',
              description: 'Create shared workspace, set permissions, enable real-time sync',
              order: 0,
              estimatedTime: 'Instant'
            },
            {
              id: `action-system-2-${Date.now()}`,
              title: 'Manage Concurrent Edits',
              description: 'Handle simultaneous edits, resolve conflicts, show user cursors',
              order: 1,
              estimatedTime: 'Continuous'
            },
            {
              id: `action-system-3-${Date.now()}`,
              title: 'Coordinate Communication',
              description: 'Route comments, notifications, and status updates between users',
              order: 2,
              estimatedTime: 'Continuous'
            }
          ]
        },
        {
          id: `lane-sarah-${Date.now()}`,
          name: 'Busy Parent (Sarah)',
          personaId: 'example-busy-parent',
          color: '#3B82F6',
          description: 'Quick edits during breaks, needs mobile-friendly interface',
          actions: [
            {
              id: `action-sarah-1-${Date.now()}`,
              title: 'Quick Mobile Review',
              description: 'Scan document for urgent changes while commuting',
              order: 0,
              estimatedTime: '2 minutes'
            },
            {
              id: `action-sarah-2-${Date.now()}`,
              title: 'Add Priority Comments',
              description: 'Flag critical issues that need immediate attention',
              order: 1,
              estimatedTime: '30 seconds'
            },
            {
              id: `action-sarah-3-${Date.now()}`,
              title: 'Voice-to-Text Edits',
              description: 'Use voice input for quick changes during multitasking',
              order: 2,
              estimatedTime: '1 minute'
            }
          ]
        },
        {
          id: `lane-alex-${Date.now()}`,
          name: 'Tech Student (Alex)',
          personaId: 'example-tech-student',
          color: '#10B981',
          description: 'Power user who tests edge cases and collaboration features',
          actions: [
            {
              id: `action-alex-1-${Date.now()}`,
              title: 'Stress Test Collaboration',
              description: 'Make rapid edits to test real-time sync and conflict resolution',
              order: 0,
              estimatedTime: '5 minutes'
            },
            {
              id: `action-alex-2-${Date.now()}`,
              title: 'Test Advanced Features',
              description: 'Try simultaneous editing, version history, and rollback functions',
              order: 1,
              estimatedTime: '3 minutes'
            },
            {
              id: `action-alex-3-${Date.now()}`,
              title: 'Report System Issues',
              description: 'Document bugs, performance issues, and improvement suggestions',
              order: 2,
              estimatedTime: '2 minutes'
            }
          ]
        },
        {
          id: `lane-robert-${Date.now()}`,
          name: 'Senior User (Robert)',
          personaId: 'example-senior-user',
          color: '#F59E0B',
          description: 'Careful reviewer who needs clear change tracking and guidance',
          actions: [
            {
              id: `action-robert-1-${Date.now()}`,
              title: 'Review Change History',
              description: 'Carefully examine what others have modified using track changes',
              order: 0,
              estimatedTime: '8 minutes'
            },
            {
              id: `action-robert-2-${Date.now()}`,
              title: 'Add Detailed Comments',
              description: 'Provide thorough feedback and ask clarifying questions',
              order: 1,
              estimatedTime: '5 minutes'
            },
            {
              id: `action-robert-3-${Date.now()}`,
              title: 'Request System Help',
              description: 'Use help features to understand collaboration tools',
              order: 2,
              estimatedTime: '3 minutes'
            }
          ]
        },
        {
          id: `lane-maria-${Date.now()}`,
          name: 'Business Professional (Maria)',
          personaId: 'example-business-pro',
          color: '#EF4444',
          description: 'Project coordinator managing workflow and deadlines',
          actions: [
            {
              id: `action-maria-1-${Date.now()}`,
              title: 'Assign Tasks and Roles',
              description: 'Delegate sections to team members and set editing permissions',
              order: 0,
              estimatedTime: '2 minutes'
            },
            {
              id: `action-maria-2-${Date.now()}`,
              title: 'Monitor Progress',
              description: 'Track completion status and coordinate team communication',
              order: 1,
              estimatedTime: '4 minutes'
            },
            {
              id: `action-maria-3-${Date.now()}`,
              title: 'Finalize and Approve',
              description: 'Review final version and manage approval workflow',
              order: 2,
              estimatedTime: '3 minutes'
            }
          ]
        },
        {
          id: `lane-jordan-${Date.now()}`,
          name: 'UX Designer (Jordan)',
          personaId: 'example-creative-pro',
          color: '#8B5CF6',
          description: 'Evaluates collaboration UX and interface design',
          actions: [
            {
              id: `action-jordan-1-${Date.now()}`,
              title: 'Assess Collaboration UX',
              description: 'Evaluate ease of seeing others\' changes and understanding workflow',
              order: 0,
              estimatedTime: '4 minutes'
            },
            {
              id: `action-jordan-2-${Date.now()}`,
              title: 'Test User Awareness',
              description: 'Check visibility of user presence, cursors, and activity indicators',
              order: 1,
              estimatedTime: '3 minutes'
            },
            {
              id: `action-jordan-3-${Date.now()}`,
              title: 'Suggest UX Improvements',
              description: 'Recommend better collaboration affordances and visual design',
              order: 2,
              estimatedTime: '5 minutes'
            }
          ]
        }
      ]
    };

    // Example system information
    const exampleSystemInfo = {
      title: 'CollaborativeDoc Pro - Real-time Document Collaboration System',
      description: 'A CSCW system enabling multiple users to simultaneously edit documents with real-time synchronization, conflict resolution, awareness indicators, and communication tools.',
      requirements: 'Real-time collaborative editing, conflict resolution algorithms, user presence awareness, commenting system, version history, permission management, cross-platform synchronization',
      constraints: 'Sub-200ms latency for real-time updates, handle up to 50 concurrent users per document, maintain data consistency, provide offline editing capabilities, ensure security and privacy',
      targetPlatform: 'Web-based collaborative platform with mobile apps (iOS/Android) and desktop clients',
      businessGoals: 'Enable effective team collaboration, reduce email communication overhead, improve document quality through peer review, support remote and hybrid work scenarios, ensure seamless workflow integration'
    };

    return NextResponse.json({
      success: true,
      template: {
        personas: examplePersonas,
        workflow: exampleWorkflow,
        systemInfo: exampleSystemInfo
      }
    });

  } catch (error) {
    console.error('Failed to load example template:', error);
    return NextResponse.json(
      { error: 'Failed to load example template' },
      { status: 500 }
    );
  }
}
