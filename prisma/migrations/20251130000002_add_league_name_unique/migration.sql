-- Add unique constraint on League.name
CREATE UNIQUE INDEX IF NOT EXISTS "League_name_key" ON "League"("name");

