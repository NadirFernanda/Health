-- Add auto-increment reference number to SupportTicket
-- Existing rows receive sequential values automatically via the sequence default.

ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "numero" SERIAL;
ALTER TABLE "SupportTicket" ADD CONSTRAINT IF NOT EXISTS "SupportTicket_numero_key" UNIQUE ("numero");
CREATE INDEX IF NOT EXISTS "SupportTicket_numero_idx" ON "SupportTicket"("numero");
