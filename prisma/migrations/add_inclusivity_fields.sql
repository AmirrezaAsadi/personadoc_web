-- Add inclusivity fields to Persona table
-- This migration adds dedicated fields for tracking inclusivity attributes and applied suggestions

ALTER TABLE "Persona" 
ADD COLUMN IF NOT EXISTS "inclusivityAttributes" JSONB,
ADD COLUMN IF NOT EXISTS "appliedSuggestions" JSONB;

-- Add comments for documentation
COMMENT ON COLUMN "Persona"."inclusivityAttributes" IS 'Structured inclusivity data organized by categories (accessibility, identity, culture, economic, family, health, education, geographic)';
COMMENT ON COLUMN "Persona"."appliedSuggestions" IS 'Track which inclusivity suggestions have been applied with timestamps and versions';

-- Create indexes for better query performance on inclusivity attributes
CREATE INDEX IF NOT EXISTS "idx_persona_inclusivity_attributes" ON "Persona" USING GIN ("inclusivityAttributes");
CREATE INDEX IF NOT EXISTS "idx_persona_applied_suggestions" ON "Persona" USING GIN ("appliedSuggestions");
