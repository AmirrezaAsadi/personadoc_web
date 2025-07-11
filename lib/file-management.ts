import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface UploadedFile {
  url: string
  fileName: string
  fileType: string
  fileSize: number
}

export class FileUploadManager {
  private static readonly UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  private static readonly ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ])

  static async uploadFile(
    file: File, 
    personaId: string, 
    category: string = 'general'
  ): Promise<UploadedFile> {
    // Validate file
    this.validateFile(file)

    // Create directory structure
    const categoryDir = join(this.UPLOAD_DIR, personaId, category)
    await mkdir(categoryDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = this.sanitizeFileName(file.name)
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = join(categoryDir, fileName)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return file info
    return {
      url: `/uploads/${personaId}/${category}/${fileName}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    }
  }

  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`)
    }

    if (!this.ALLOWED_TYPES.has(file.type)) {
      throw new Error(`File type ${file.type} not allowed`)
    }
  }

  private static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
  }

  static async handleFormData(request: NextRequest): Promise<{
    files: UploadedFile[]
    fields: Record<string, string>
  }> {
    const formData = await request.formData()
    const files: UploadedFile[] = []
    const fields: Record<string, string> = {}

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (value.size > 0) {
          const personaId = formData.get('personaId') as string
          const category = formData.get('category') as string || 'general'
          
          const uploadedFile = await this.uploadFile(value, personaId, category)
          files.push(uploadedFile)
        }
      } else {
        fields[key] = value as string
      }
    }

    return { files, fields }
  }
}

// Text extraction utilities
export class TextExtractor {
  static async extractFromFile(file: File): Promise<string> {
    const fileType = file.type

    switch (fileType) {
      case 'text/plain':
        return await file.text()
      
      case 'application/json':
        const jsonContent = await file.text()
        return JSON.stringify(JSON.parse(jsonContent), null, 2)
      
      case 'text/csv':
        return await file.text()
      
      case 'application/pdf':
        // This would require a PDF parsing library
        return 'PDF content extraction not implemented yet'
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // This would require a DOCX parsing library
        return 'DOCX content extraction not implemented yet'
      
      default:
        if (fileType.startsWith('image/')) {
          return 'Image file - content cannot be extracted as text'
        }
        return 'Unsupported file type for text extraction'
    }
  }
}

// Image processing utilities
export class ImageProcessor {
  static async processPersonaImage(file: File, personaId: string): Promise<UploadedFile> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Upload the original image
    const uploadedFile = await FileUploadManager.uploadFile(file, personaId, 'profile')

    // Here you could add image processing like:
    // - Resize to standard dimensions
    // - Generate thumbnails
    // - Optimize for web
    // - Extract metadata

    return uploadedFile
  }

  static async generatePersonaAvatar(personaData: any): Promise<string> {
    // This could integrate with AI image generation services
    // For now, return a placeholder or default avatar
    const avatarStyle = this.determineAvatarStyle(personaData)
    return `/avatars/default-${avatarStyle}.png`
  }

  private static determineAvatarStyle(personaData: any): string {
    // Simple logic to determine avatar style based on persona data
    const age = personaData.age || 30
    const occupation = personaData.occupation?.toLowerCase() || ''
    
    if (age < 25) return 'young'
    if (age > 60) return 'senior'
    if (occupation.includes('tech') || occupation.includes('engineer')) return 'tech'
    if (occupation.includes('business') || occupation.includes('manager')) return 'business'
    if (occupation.includes('creative') || occupation.includes('artist')) return 'creative'
    
    return 'general'
  }
}
