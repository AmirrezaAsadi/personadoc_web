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

    // Example workflow for E-commerce Checkout
    const exampleWorkflow = {
      id: 'example-ecommerce-checkout',
      name: 'E-commerce Checkout Process',
      description: 'Multi-persona checkout flow for mobile e-commerce application',
      collaborationType: 'parallel' as const,
      swimLanes: [
        {
          id: 'lane-busy-parent',
          name: 'Busy Parent (Sarah)',
          personaId: 'example-busy-parent',
          color: '#3B82F6',
          description: 'Time-pressured parent needing quick, efficient checkout',
          actions: [
            {
              id: 'action-1-sarah',
              title: 'Quick Product Review',
              description: 'Rapidly scan product details while managing distractions',
              order: 0,
              estimatedTime: '30 seconds'
            },
            {
              id: 'action-2-sarah',
              title: 'Auto-fill Shipping Info',
              description: 'Use saved address and payment info for speed',
              order: 1,
              estimatedTime: '15 seconds'
            },
            {
              id: 'action-3-sarah',
              title: 'One-Click Purchase',
              description: 'Complete purchase with minimal steps',
              order: 2,
              estimatedTime: '10 seconds'
            }
          ]
        },
        {
          id: 'lane-tech-student',
          name: 'Tech Student (Alex)',
          personaId: 'example-tech-student',
          color: '#10B981',
          description: 'Budget-conscious student seeking best deals',
          actions: [
            {
              id: 'action-1-alex',
              title: 'Compare Prices',
              description: 'Check for better deals and price comparisons',
              order: 0,
              estimatedTime: '2 minutes'
            },
            {
              id: 'action-2-alex',
              title: 'Apply Discount Codes',
              description: 'Search for and apply multiple coupon codes',
              order: 1,
              estimatedTime: '1 minute'
            },
            {
              id: 'action-3-alex',
              title: 'Split Payment Methods',
              description: 'Use gift cards, store credit, and card for payment',
              order: 2,
              estimatedTime: '45 seconds'
            }
          ]
        },
        {
          id: 'lane-senior-user',
          name: 'Senior User (Robert)',
          personaId: 'example-senior-user',
          color: '#F59E0B',
          description: 'Cautious user needing clear guidance and confirmation',
          actions: [
            {
              id: 'action-1-robert',
              title: 'Read Product Details',
              description: 'Carefully review all product information and policies',
              order: 0,
              estimatedTime: '3 minutes'
            },
            {
              id: 'action-2-robert',
              title: 'Contact Customer Service',
              description: 'Call support to verify order details and policies',
              order: 1,
              estimatedTime: '5 minutes'
            },
            {
              id: 'action-3-robert',
              title: 'Print Receipt Confirmation',
              description: 'Get physical confirmation of the order',
              order: 2,
              estimatedTime: '1 minute'
            }
          ]
        },
        {
          id: 'lane-business-pro',
          name: 'Business Professional (Maria)',
          personaId: 'example-business-pro',
          color: '#EF4444',
          description: 'Professional requiring detailed records and efficiency',
          actions: [
            {
              id: 'action-1-maria',
              title: 'Expense Category Setup',
              description: 'Assign purchase to correct business expense category',
              order: 0,
              estimatedTime: '30 seconds'
            },
            {
              id: 'action-2-maria',
              title: 'Tax Documentation',
              description: 'Ensure proper tax documentation for business records',
              order: 1,
              estimatedTime: '45 seconds'
            },
            {
              id: 'action-3-maria',
              title: 'Integration with Accounting',
              description: 'Sync purchase with enterprise accounting system',
              order: 2,
              estimatedTime: '20 seconds'
            }
          ]
        }
      ]
    };

    // Example system information
    const exampleSystemInfo = {
      title: 'ShopFast Mobile E-commerce App',
      description: 'A mobile-first e-commerce platform designed for quick, efficient shopping across diverse user demographics',
      requirements: 'Payment processing, inventory management, user authentication, address validation, multi-payment methods, mobile optimization',
      constraints: 'Mobile-first design, 3-second load times, accessibility compliance, security standards, offline capability for cart',
      targetPlatform: 'iOS and Android mobile applications with responsive web backup',
      businessGoals: 'Reduce cart abandonment by 40%, increase conversion rate by 25%, improve user satisfaction scores, expand to senior and family demographics'
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
