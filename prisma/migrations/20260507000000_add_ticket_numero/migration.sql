-- Add auto-increment reference number to SupportTicket
-- Existing rows receive sequential values automatically via the sequence default.

ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "numero" SERIAL;
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_numero_key" UNIQUE ("numero");
EXCEPTION WHEN duplicate_table THEN NULL;
           WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "SupportTicket_numero_idx" ON "SupportTicket"("numero");
