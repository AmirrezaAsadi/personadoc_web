# Multi-Agent Interview System

## Overview

The Multi-Agent Interview System is an advanced feature in PersonaDoc that uses AI-powered interview bots and validation agents to enhance persona development through structured data collection and quality assurance.

## System Architecture

### Core Components

1. **Interview Bots** - AI agents that conduct interviews with participants
2. **Validation Agents** - Quality assurance agents that validate interview data
3. **RabbitMQ Message Queue** - Handles communication between agents
4. **Interview Sessions** - Shareable interview instances
5. **Participant Management** - Tracks participant responses and progress

### Database Schema

The system extends the existing Prisma schema with the following models:

- `InterviewBot` - Configuration for AI interview agents
- `InterviewSession` - Interview instances with shareable links
- `ParticipantSession` - Individual participant progress tracking
- `ValidationAgent` - Configuration for quality validation agents
- `ValidationRule` - Rules linking bots to validation agents
- `ValidationResult` - Results from validation agent analysis
- `QueueMessage` - Message queue management

## Features

### Interview Bot Configuration

- **Personality Settings**: Tone (professional, casual, empathetic, analytical)
- **Interview Style**: Question depth, conversation flow, time management
- **Research Questions**: Categorized questions with priority levels
- **Adaptive Behavior**: Response analysis, sentiment adjustment, topic pivoting

### Validation Agents

- **Quality Validation**: Checks response completeness and coherence
- **Completeness Validation**: Ensures all required questions are answered
- **Consistency Validation**: Detects contradictions in responses
- **Bias Detection**: Identifies potential bias in questions or responses
- **Relevance Validation**: Ensures responses align with research focus

### Interview Sessions

- **Shareable Links**: Generate unique URLs for participant access
- **Time Management**: Configurable expiration times
- **Participant Limits**: Control maximum number of participants
- **Progress Tracking**: Real-time monitoring of completion status

## API Endpoints

### Interview Bots
- `GET /api/interview-bots` - List user's interview bots
- `POST /api/interview-bots` - Create new interview bot

### Interview Sessions
- `GET /api/interview-sessions` - List user's interview sessions
- `POST /api/interview-sessions` - Create new interview session
- `GET /api/interview/[token]` - Get session details by token
- `POST /api/interview/[token]` - Join interview session

### Response Management
- `POST /api/interview/submit-response` - Submit participant response

## Usage Guide

### Creating an Interview Bot

1. Click "Create Bot" in the Multi-Agent Interview System
2. Configure bot personality and interview style
3. Define research questions by category and priority
4. Set up adaptive behavior options
5. Save and activate the bot

### Setting Up an Interview Session

1. Select an interview bot
2. Define research focus areas
3. Set participant limits and expiration time
4. Generate shareable interview link
5. Share link with target participants

### Monitoring and Validation

1. Track participant progress in real-time
2. View validation results from quality agents
3. Analyze insights and recommendations
4. Export data for persona development

## Technical Implementation

### RabbitMQ Integration

The system uses RabbitMQ for asynchronous message processing:

```typescript
// Message types
- interview.start - Session initiation
- interview.question - Dynamic question generation
- interview.response - Participant response processing
- interview.complete - Session completion
- validation.quality - Quality assessment
- validation.completeness - Completeness check
- validation.bias - Bias detection
- persona.update - Persona data updates
```

### Services

1. **InterviewBotService** (`lib/interview-bot.ts`)
   - Bot management and session handling
   - Question generation and response processing
   - Progress tracking and completion logic

2. **ValidationAgentService** (`lib/validation-agent.ts`)
   - Multiple validation types implementation
   - Scoring algorithms and threshold management
   - Issue detection and recommendation generation

3. **RabbitMQService** (`lib/rabbitmq.ts`)
   - Message queue connection management
   - Publisher/subscriber pattern implementation
   - Error handling and retry logic

### UI Components

1. **MultiAgentSystem** (`components/multi-agent-system-clean.tsx`)
   - Dashboard overview with statistics
   - Bot and session management interface
   - Tabbed navigation for different views

## Environment Setup

### Required Dependencies

```bash
npm install amqplib @types/amqplib uuid @types/uuid
```

### Environment Variables

```env
RABBITMQ_URL=amqp://localhost:5672  # RabbitMQ connection string
```

### Database Migration

```bash
npx prisma db push  # Apply schema changes
npx prisma generate # Generate new client types
```

## Security Considerations

- Session tokens are UUIDs to prevent guessing
- Participant data is anonymized when possible
- Validation agents detect potentially sensitive information
- Rate limiting on API endpoints prevents abuse
- Admin controls for bot and agent management

## Performance Optimizations

- Asynchronous processing via RabbitMQ prevents blocking
- Database indexing on frequently queried fields
- Pagination for large result sets
- Caching of frequently accessed bot configurations

## Future Enhancements

1. **Advanced AI Integration**
   - GPT-based question generation
   - Sentiment analysis for real-time adaptation
   - Natural language understanding for responses

2. **Analytics Dashboard**
   - Interview performance metrics
   - Response quality trends
   - Bot effectiveness analysis

3. **Integration Features**
   - Export to external survey platforms
   - Integration with CRM systems
   - Webhook notifications for completions

4. **Mobile Optimization**
   - Responsive interview interface
   - Progressive web app capabilities
   - Offline response collection

## Troubleshooting

### Common Issues

1. **RabbitMQ Connection Errors**
   - Ensure RabbitMQ server is running
   - Verify connection string in environment variables
   - Check network connectivity and firewall settings

2. **Database Schema Issues**
   - Run `npx prisma db push` to apply schema changes
   - Check for foreign key constraint violations
   - Verify user permissions for database operations

3. **Interview Link Access**
   - Ensure session hasn't expired
   - Check participant limit hasn't been exceeded
   - Verify session status is ACTIVE or PENDING

### Monitoring

- Check RabbitMQ management interface for queue status
- Monitor database performance for bottlenecks
- Use logging to track agent processing times
- Set up alerts for failed validation attempts

## Contributing

When contributing to the multi-agent system:

1. Follow TypeScript best practices
2. Add proper error handling and logging
3. Include tests for new validation logic
4. Update documentation for new features
5. Consider scalability implications for large user bases
