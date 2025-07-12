-- Add isActive and role fields to User table
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Set admin role for the admin user
UPDATE "User" SET "role" = 'admin' WHERE "email" = 'admin@test.com';

-- Create index for faster role-based queries
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
