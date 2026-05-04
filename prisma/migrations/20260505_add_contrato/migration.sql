-- Add CONTRATO_PENDENTE value to EstadoCandidatura enum
ALTER TYPE "EstadoCandidatura" ADD VALUE IF NOT EXISTS 'CONTRATO_PENDENTE' AFTER 'PENDENTE';

-- Add contract timestamp fields to Candidatura
ALTER TABLE "Candidatura" ADD COLUMN IF NOT EXISTS "contratoGeradoEm" TIMESTAMP(3);
ALTER TABLE "Candidatura" ADD COLUMN IF NOT EXISTS "contratoAssinadoEm" TIMESTAMP(3);
