-- Phase 3: Médico pode publicar plantão (para substituto)

-- clinicaId passa a ser opcional
ALTER TABLE "Plantao" ALTER COLUMN "clinicaId" DROP NOT NULL;

-- Campos do publicador médico
ALTER TABLE "Plantao" ADD COLUMN IF NOT EXISTS "profissionalPublicadorId" TEXT;
ALTER TABLE "Plantao" ADD COLUMN IF NOT EXISTS "publicadoPorMedico" BOOLEAN NOT NULL DEFAULT false;

-- FK para Profissional
ALTER TABLE "Plantao" ADD CONSTRAINT "Plantao_profissionalPublicadorId_fkey"
  FOREIGN KEY ("profissionalPublicadorId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Índice
CREATE INDEX IF NOT EXISTS "Plantao_profissionalPublicadorId_idx" ON "Plantao"("profissionalPublicadorId");
CREATE INDEX IF NOT EXISTS "Plantao_publicadoPorMedico_idx" ON "Plantao"("publicadoPorMedico");
