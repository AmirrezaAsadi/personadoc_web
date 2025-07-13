import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { grok } from '@/lib/grok'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { 
      prompt,
      name,
      description,
      personaIds,
      experimentId
    } = await request.json()

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'UI prompt is required' }, { status: 400 })
    }

    // Get persona data for context if provided
    let personaContext = ''
    if (personaIds && personaIds.length > 0) {
      const personas = await prisma.persona.findMany({
        where: {
          id: { in: personaIds },
          createdBy: userId
        }
      })

      personaContext = `

PERSONA CONTEXT FOR UI DESIGN:
${personas.map(persona => `
- ${persona.name} (${persona.occupation || 'No occupation'})
  Age: ${persona.age || 'Not specified'}
  Background: ${persona.introduction || 'Not specified'}
  Personality: ${JSON.stringify(persona.personalityTraits) || 'Not specified'}
`).join('')}

Please consider these personas' needs, preferences, and technical capabilities when designing the UI.`
    }

    const aiPrompt = `You are an expert UI/UX designer and frontend developer. Generate a complete, functional UI based on the user's request.

USER REQUEST: ${prompt}
${personaContext}

REQUIREMENTS:
- Generate clean, modern, responsive HTML
- Include comprehensive CSS styling
- Add interactive JavaScript functionality
- Use semantic HTML elements
- Implement accessibility best practices
- Create a visually appealing design
- Make it functional and interactive

RESPOND WITH ONLY A JSON OBJECT in this exact format:
{
  "html": "Complete HTML structure with semantic elements",
  "css": "Comprehensive CSS styling with modern design, responsive layout, and animations",
  "javascript": "Interactive JavaScript functionality, event handlers, and dynamic behavior",
  "designNotes": ["Design decision 1", "Design decision 2", "Design decision 3"],
  "personaInsights": ["How this design works for persona 1", "How this design works for persona 2"],
  "accessibilityFeatures": ["Accessibility feature 1", "Accessibility feature 2"]
}

DESIGN GUIDELINES:
- Use a modern, clean aesthetic
- Implement proper spacing and typography
- Include hover effects and transitions
- Make it mobile-responsive
- Use appropriate color schemes
- Add loading states and feedback
- Include proper form validation if applicable
- Consider user experience flows

Generate a complete, production-ready UI that fulfills the user's request.`

    try {
      // Use Grok AI for UI generation
      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [
          {
            role: "system" as const,
            content: "You are an expert UI/UX designer and frontend developer specializing in creating complete, functional web interfaces. Always respond with valid JSON containing HTML, CSS, and JavaScript code."
          },
          {
            role: "user" as const,
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 12000,
      })

      const aiResponse = response.choices[0]?.message?.content || ''
      
      // Try to parse AI response as JSON
      let generatedUI
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          generatedUI = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in AI response')
        }
      } catch (parseError) {
        console.error('Failed to parse AI UI generation:', parseError)
        console.log('AI Response:', aiResponse)
        
        // Fallback UI generation
        generatedUI = createFallbackUI(prompt, name)
      }

      // Create the UI object
      const uiObject = {
        id: `ui-${Date.now()}`,
        name: name || `Generated UI ${Date.now()}`,
        description: description || 'AI-generated user interface',
        prompt: prompt,
        htmlCode: generatedUI.html || '<div>Failed to generate HTML</div>',
        cssCode: generatedUI.css || '/* Failed to generate CSS */',
        jsCode: generatedUI.javascript || '// Failed to generate JavaScript',
        personaIds: personaIds || [],
        designNotes: generatedUI.designNotes || [],
        personaInsights: generatedUI.personaInsights || [],
        accessibilityFeatures: generatedUI.accessibilityFeatures || [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }

      return NextResponse.json(uiObject)

    } catch (aiError) {
      console.error('AI UI generation failed:', aiError)
      
      // Return fallback UI
      const fallbackUI = createFallbackUI(prompt, name || 'Generated UI')
      
      const uiObject = {
        id: `ui-${Date.now()}`,
        name: name || `Generated UI ${Date.now()}`,
        description: description || 'AI-generated user interface',
        prompt: prompt,
        htmlCode: fallbackUI.html,
        cssCode: fallbackUI.css,
        jsCode: fallbackUI.javascript,
        personaIds: personaIds || [],
        designNotes: ['Fallback UI generated due to AI service unavailability'],
        personaInsights: ['UI designed with general best practices'],
        accessibilityFeatures: ['Basic semantic HTML structure'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }

      return NextResponse.json(uiObject)
    }

  } catch (error) {
    console.error('UI generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during UI generation' }, 
      { status: 500 }
    )
  }
}

function createFallbackUI(prompt: string, name: string) {
  return {
    html: `
      <div class="fallback-ui">
        <header class="ui-header">
          <h1>${name}</h1>
          <p>Generated based on: "${prompt}"</p>
        </header>
        <main class="ui-content">
          <div class="placeholder-section">
            <h2>UI Generation Placeholder</h2>
            <p>This is a fallback interface. The AI service is temporarily unavailable.</p>
            <button class="primary-btn" onclick="handleClick()">Sample Button</button>
            <div class="form-section">
              <input type="text" placeholder="Sample input" class="sample-input">
              <textarea placeholder="Sample textarea" class="sample-textarea"></textarea>
            </div>
          </div>
        </main>
      </div>
    `,
    css: `
      .fallback-ui {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: white;
      }
      
      .ui-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);
      }
      
      .ui-header h1 {
        margin: 0 0 10px 0;
        font-size: 2.5rem;
        font-weight: 700;
      }
      
      .ui-content {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 30px;
        backdrop-filter: blur(10px);
      }
      
      .placeholder-section h2 {
        color: #fff;
        margin-bottom: 20px;
        font-size: 1.5rem;
      }
      
      .primary-btn {
        background: linear-gradient(45deg, #ff6b6b, #ee5a52);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease;
        margin: 10px 0;
      }
      
      .primary-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .form-section {
        margin-top: 20px;
      }
      
      .sample-input, .sample-textarea {
        width: 100%;
        margin: 10px 0;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 14px;
      }
      
      .sample-input::placeholder, .sample-textarea::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }
      
      .sample-textarea {
        height: 80px;
        resize: vertical;
      }
      
      @media (max-width: 768px) {
        .fallback-ui {
          padding: 10px;
        }
        
        .ui-header h1 {
          font-size: 2rem;
        }
      }
    `,
    javascript: `
      function handleClick() {
        alert('This is a sample interaction! The AI will generate custom functionality based on your requirements.');
      }
      
      // Add some interactive behavior
      document.addEventListener('DOMContentLoaded', function() {
        const inputs = document.querySelectorAll('.sample-input, .sample-textarea');
        
        inputs.forEach(input => {
          input.addEventListener('focus', function() {
            this.style.background = 'rgba(255, 255, 255, 0.3)';
          });
          
          input.addEventListener('blur', function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
          });
        });
        
        // Add a simple animation
        const content = document.querySelector('.ui-content');
        if (content) {
          content.style.opacity = '0';
          content.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            content.style.transition = 'all 0.6s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
          }, 100);
        }
      });
    `
  }
}
