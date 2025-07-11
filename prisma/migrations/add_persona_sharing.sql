-- AddPersonaSharing migration
-- Add public sharing capabilities to personas

ALTER TABLE "Persona" 
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shareToken" TEXT,
ADD COLUMN "sharedAt" TIMESTAMP(3),
ADD COLUMN "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "allowComments" BOOLEAN NOT NULL DEFAULT false;

-- Create unique index for shareToken
CREATE UNIQUE INDEX "Persona_shareToken_key" ON "Persona"("shareToken");
