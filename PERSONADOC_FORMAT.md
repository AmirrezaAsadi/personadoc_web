# PersonaDoc File Format Specification

## Overview

The `.personaDoc` format is a comprehensive, portable file format designed specifically for PersonaDoc persona data. It combines all persona information, research data, timeline events, versions, interactions, and associated files into a single, compressed archive.

## 🎯 **Why PersonaDoc Format?**

### Benefits:
- **Complete Package**: Everything in one file (persona + research + files + timeline)
- **Portable**: Easy to share, backup, and migrate between systems
- **Compressed**: ZIP-based compression reduces file size
- **Structured**: Clear organization of different data types
- **Version Controlled**: Built-in format versioning for future compatibility
- **Self-Contained**: Includes original uploaded files and images

### Use Cases:
- **Backup & Archive**: Complete persona snapshots
- **Collaboration**: Share personas with research data
- **Migration**: Move personas between environments
- **Templates**: Create reusable persona templates
- **Audit Trail**: Maintain complete persona history

## 📁 **File Structure**

```
persona-name.personaDoc (ZIP archive)
├── manifest.json              # File metadata and format version
├── persona.json              # Core persona information
├── research/                 # Research data directory
│   ├── metadata.json        # Research items metadata
│   └── files/               # Original uploaded files
│       ├── research-id-1/
│       │   ├── document.pdf
│       │   └── data.csv
│       └── research-id-2/
│           └── interview.docx
├── timeline.json            # Timeline events
├── versions.json           # Version history
├── interactions.json       # Conversation history (optional)
└── assets/                 # Images and media files
    ├── profile.jpg         # Profile image
    └── other-images/
```

## 📋 **File Specifications**

### 1. manifest.json
```json
{
  "formatVersion": "1.0",
  "personaDoc": {
    "name": "Sarah Johnson",
    "id": "clx123abc...",
    "exportedAt": "2024-07-10T10:30:00Z",
    "exportedBy": "user@example.com",
    "version": "2.1"
  },
  "contents": {
    "hasInteractions": true,
    "hasResearchFiles": true,
    "hasImages": true,
    "researchCount": 5,
    "versionsCount": 3,
    "timelineEventsCount": 12
  }
}
```

### 2. persona.json
```json
{
  "id": "clx123abc...",
  "name": "Sarah Johnson",
  "age": 32,
  "occupation": "Product Manager",
  "location": "San Francisco, CA",
  "introduction": "Sarah is a tech-savvy product manager...",
  "personalityTraits": ["analytical", "collaborative", "detail-oriented"],
  "interests": ["technology", "design", "user experience"],
  "gadgets": ["iPhone", "MacBook Pro", "Apple Watch"],
  "createdAt": "2024-01-15T10:00:00Z",
  "createdBy": "user123",
  "creator": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "profileImage": "/uploads/persona-id/profile.jpg"
}
```

### 3. research/metadata.json
```json
[
  {
    "id": "research-1",
    "title": "User Interview Q1 2024",
    "description": "Customer discovery interviews",
    "content": "Interview transcript and insights...",
    "category": "interview",
    "source": "Customer interviews",
    "relevantDate": "2024-03-15T00:00:00Z",
    "tags": ["user-research", "feedback", "q1-2024"],
    "dataSourceTypes": ["User Interviews"],
    "createdAt": "2024-03-16T14:30:00Z",
    "createdBy": "user123",
    "files": [
      {
        "fileName": "interview-transcript.pdf",
        "fileType": "application/pdf",
        "fileSize": 245760,
        "url": "/uploads/persona-id/research-1/interview-transcript.pdf"
      }
    ]
  }
]
```

### 4. timeline.json
```json
[
  {
    "id": "timeline-1",
    "title": "Persona Created",
    "description": "Sarah Johnson persona was created",
    "eventType": "milestone",
    "eventDate": "2024-01-15T10:00:00Z",
    "importance": 10,
    "category": "creation",
    "color": "#22C55E",
    "icon": "user-plus",
    "createdBy": "user123",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "timeline-2",
    "title": "Research Added: User Interview Q1 2024",
    "description": "Customer discovery interviews uploaded",
    "eventType": "insight",
    "eventDate": "2024-03-16T14:30:00Z",
    "researchDataId": "research-1",
    "importance": 6,
    "category": "research",
    "color": "#F59E0B",
    "icon": "file-text",
    "createdBy": "user123",
    "createdAt": "2024-03-16T14:30:00Z"
  }
]
```

### 5. versions.json
```json
[
  {
    "id": "v1.0",
    "version": "1.0",
    "name": "Sarah Johnson - Initial Version",
    "snapshot": {
      "name": "Sarah Johnson",
      "age": 32,
      "occupation": "Product Manager",
      // ... complete persona state
    },
    "isActive": false,
    "isDraft": false,
    "notes": "Initial version created",
    "createdAt": "2024-01-15T10:00:00Z",
    "createdBy": "user123"
  },
  {
    "id": "v2.0",
    "version": "2.0",
    "name": "Sarah Johnson - Updated with Research",
    "snapshot": {
      // ... updated persona state
    },
    "changes": {
      "summary": "Added customer research insights",
      "modifications": ["Updated personality traits", "Added new interests"]
    },
    "isActive": true,
    "isDraft": false,
    "notes": "Updated based on Q1 research findings",
    "createdAt": "2024-03-20T16:45:00Z",
    "createdBy": "user123"
  }
]
```

### 6. interactions.json (Optional)
```json
[
  {
    "id": "interaction-1",
    "content": "What are your main pain points with the current product?",
    "response": "My biggest challenges are the complex navigation and lack of mobile optimization...",
    "createdAt": "2024-02-01T09:15:00Z",
    "userId": "user123"
  }
]
```

## 🔧 **Technical Implementation**

### Creating PersonaDoc Files:
```typescript
import { PersonaDocFormat } from '@/lib/personadoc-format'

const buffer = await PersonaDocFormat.createPersonaDoc(personaId, {
  includeInteractions: true,
  includeFiles: true,
  includeImages: true
})

// Save or send buffer as .personaDoc file
```

### Parsing PersonaDoc Files:
```typescript
const parsedData = await PersonaDocFormat.parsePersonaDoc(fileBuffer)
const { manifest, persona, research, timeline, versions, interactions, files } = parsedData
```

## 📤 **Export Options**

### API Endpoint:
```
GET /api/personas/[id]/export?format=personaDoc&includeInteractions=true&includeImages=true
```

### Frontend Usage:
```typescript
const response = await fetch(`/api/personas/${personaId}/export?format=personaDoc&includeInteractions=true&includeImages=true`)
const blob = await response.blob()
// Download as file
```

## 📥 **Import Options**

### API Endpoint:
```
POST /api/personas/import
```

### Import Parameters:
- `file`: The .personaDoc file
- `createAsTemplate`: Create as reusable template
- `preserveId`: Keep original persona ID (if you own it)
- `importFiles`: Include uploaded research files
- `importInteractions`: Include conversation history

### Frontend Usage:
```typescript
const formData = new FormData()
formData.append('file', personaDocFile)
formData.append('importFiles', 'true')
formData.append('importInteractions', 'true')

const response = await fetch('/api/personas/import', {
  method: 'POST',
  body: formData
})
```

## 🔒 **Security & Validation**

### File Validation:
- File extension must be `.personaDoc`
- Must be valid ZIP archive
- Must contain required files (`manifest.json`, `persona.json`)
- Format version must be supported
- File size limits enforced

### Import Security:
- User authentication required
- Only import to personas you own (unless creating new)
- File type validation for embedded files
- Malicious file scanning (recommended)

## 🔄 **Version Compatibility**

### Current Version: 1.0
- Initial implementation
- Supports all core features

### Future Versions:
- Backward compatibility maintained
- Migration utilities for format updates
- Version detection in manifest.json

## 💡 **Best Practices**

### When to Use PersonaDoc:
- ✅ Complete persona backup
- ✅ Sharing personas with research team
- ✅ Migrating between environments
- ✅ Creating persona templates
- ✅ Long-term archival

### When to Use Other Formats:
- JSON: API integration, custom processing
- CSV: Data analysis, spreadsheet import
- Markdown: Documentation, reporting

### File Management:
- Regular exports for backup
- Organized naming convention
- Version control for important personas
- Clean up old exports periodically

## 🚀 **Integration Examples**

### Backup Script:
```typescript
// Automatic backup of all personas
const personas = await prisma.persona.findMany()
for (const persona of personas) {
  const backup = await PersonaDocFormat.createPersonaDoc(persona.id, {
    includeInteractions: true,
    includeFiles: true,
    includeImages: true
  })
  await saveToBackupStorage(`${persona.name}-${Date.now()}.personaDoc`, backup)
}
```

### Bulk Import:
```typescript
// Import multiple PersonaDoc files
const files = await getPersonaDocFiles()
for (const file of files) {
  await importPersonaDoc(file, {
    createAsTemplate: true,
    importFiles: true
  })
}
```

The PersonaDoc format provides a robust, future-proof way to manage persona data with complete fidelity and portability!
