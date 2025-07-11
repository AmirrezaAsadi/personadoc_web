# PersonaDoc Knowledge Management System

## Overview

PersonaDoc now includes a comprehensive knowledge management system that transforms it into a long-term customer relationship and persona evolution platform. This system provides:

- **Branching & Versioning**: Track persona evolution over time
- **Research Upload with AI**: Upload and process research with vector embeddings
- **Timeline Management**: Visual timeline of persona development
- **Export & Import**: Comprehensive data export in multiple formats
- **Vector Search**: AI-powered search through uploaded research

## Features

### 1. Research Upload & AI Processing

Upload research documents and data that get processed with vector embeddings for intelligent retrieval:

- **Supported Formats**: PDF, DOCX, TXT, CSV, JSON, XLSX
- **Vector Embeddings**: Automatic creation using OpenAI embeddings
- **RAG Integration**: Research data becomes searchable through AI
- **Data Source Types**: Categorize research by type (interviews, surveys, etc.)

### 2. Persona Versioning & Branching

Track how personas evolve over time:

- **Version History**: Create snapshots of persona states
- **Branching**: Create experimental versions of personas
- **Publishing**: Activate specific versions as current
- **Change Tracking**: Record what changed between versions

### 3. Timeline Management

Visual timeline of persona development:

- **Automatic Events**: Persona creation, interactions, research uploads
- **Manual Events**: Add custom milestones and observations
- **Filtering**: Filter by event type, date range, importance
- **Integration**: Links to research data and interactions

### 4. Comprehensive Export

Export persona data in multiple formats:

- **JSON**: Complete data export for backup/migration
- **CSV**: Spreadsheet format for analysis
- **Markdown**: Human-readable documentation
- **Include Options**: Choose to include interactions, images, etc.

## Database Schema Enhancement

The system extends the existing Prisma schema with new models:

```prisma
model PersonaVersion {
  // Version tracking with branching support
}

model ResearchData {
  // Research documents with metadata and AI processing
}

model TimelineEvent {
  // Timeline events with rich metadata
}
```

## API Endpoints

### Research Management
- `POST /api/personas/[id]/research-upload` - Upload research data
- `GET /api/personas/[id]/research-upload` - Get research data
- `POST /api/personas/[id]/research` - Process with RAG (existing)

### Timeline Management
- `GET /api/personas/[id]/timeline` - Get timeline events
- `POST /api/personas/[id]/timeline` - Create timeline event

### Version Management
- `GET /api/personas/[id]/versions` - Get version history
- `POST /api/personas/[id]/versions` - Create new version
- `PATCH /api/personas/[id]/versions` - Publish version

### Export
- `GET /api/personas/[id]/export` - Export persona data

## Usage

### 1. Enable Knowledge Management

Add the KnowledgeManagementTab to your persona page:

```tsx
import { KnowledgeManagementTab } from '@/components/persona-tabs/KnowledgeManagementTab'

<KnowledgeManagementTab 
  personaId={personaId} 
  personaName={personaName} 
/>
```

### 2. Upload Research Data

Use the ResearchUpload component:

```tsx
import { ResearchUpload } from '@/components/research-upload'

<ResearchUpload 
  personaId={personaId}
  onUploadComplete={(research) => {
    // Handle upload completion
  }}
/>
```

### 3. View Timeline

Use the TimelineView component:

```tsx
import { TimelineView } from '@/components/timeline-view'

<TimelineView personaId={personaId} />
```

## Migration

To enable the new features:

1. **Update Database Schema**:
   ```bash
   npm run db:push
   ```

2. **Migrate Existing Data** (after schema update):
   ```bash
   npm run db:migrate-personas
   ```

3. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Integration with Existing RAG System

The knowledge management system seamlessly integrates with the existing research RAG system:

1. **File Upload**: Files are processed and stored with metadata
2. **Vector Processing**: Research data is automatically processed with OpenAI embeddings
3. **Pinecone Storage**: Vector embeddings are stored in Pinecone for search
4. **RAG Integration**: Uploaded research becomes part of the persona's knowledge base

## Configuration

Ensure these environment variables are set:

```env
# Existing required variables
OPENAI_EMBEDDINGS_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name

# Database
DATABASE_URL=your_postgresql_url
```

## File Storage

The system includes configurable file storage:

- **Local Storage**: Files stored in `public/uploads/`
- **Cloud Storage**: Easily extendable for S3, GCS, etc.
- **File Processing**: Text extraction from various formats
- **Security**: File type validation and size limits

## Knowledge Management Workflow

1. **Create Persona**: Start with basic persona information
2. **Upload Research**: Add research documents and data
3. **AI Processing**: System creates vector embeddings automatically
4. **Timeline Tracking**: Key events are automatically tracked
5. **Version Creation**: Create versions as persona evolves
6. **Export Data**: Export complete persona knowledge for sharing/backup

## Benefits

- **Long-term Relationship Management**: Track customer/persona evolution over time
- **AI-Powered Insights**: Vector search through all research data
- **Collaboration**: Export and share persona knowledge
- **Audit Trail**: Complete history of persona development
- **Scalability**: Handles large amounts of research data efficiently

## Future Enhancements

Potential future features:
- Advanced analytics and insights
- Automated persona updates based on new research
- Integration with external data sources
- Collaborative editing and sharing
- Advanced search and filtering
- Machine learning-powered persona suggestions
