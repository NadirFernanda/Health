-- Phase 2: Schema gaps from 04-banco-de-dados.md spec

-- Add OUTRO to TipoProfissional enum
ALTER TYPE "TipoProfissional" ADD VALUE IF NOT EXISTS 'OUTRO';

-- Add criadoEm to Clinica
ALTER TABLE "Clinica" ADD COLUMN IF NOT EXISTS "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add salaId and tipoProfissional to Plantao (Turno)
ALTER TABLE "Plantao" ADD COLUMN IF NOT EXISTS "salaId" TEXT;
ALTER TABLE "Plantao" ADD COLUMN IF NOT EXISTS "tipoProfissional" "TipoProfissional" NOT NULL DEFAULT 'MEDICO';

-- Add FK constraint for Plantao.salaId -> Sala.id
ALTER TABLE "Plantao" ADD CONSTRAINT "Plantao_salaId_fkey"
  FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraint on Profissional.numeroSinome (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS "Profissional_numeroSinome_key"
  ON "Profissional"("numeroSinome")
  WHERE "numeroSinome" IS NOT NULL;

-- Migrate TransacaoCarteira.valor (Int) to valorCentavos (BigInt)
ALTER TABLE "TransacaoCarteira" ADD COLUMN IF NOT EXISTS "valorCentavos" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "TransacaoCarteira" ADD COLUMN IF NOT EXISTS "referencia" TEXT;
-- Copy existing int values (multiply by 100 to represent centavos)
UPDATE "TransacaoCarteira" SET "valorCentavos" = "valor"::BIGINT * 100 WHERE "valorCentavos" = 0;
ALTER TABLE "TransacaoCarteira" DROP COLUMN IF EXISTS "valor";

-- ─── Indexes ────────────────────────────────────────────────────────────────

-- Profissional
CREATE INDEX IF NOT EXISTS "Profissional_tipo_idx" ON "Profissional"("tipo");
CREATE INDEX IF NOT EXISTS "Profissional_especialidade_idx" ON "Profissional"("especialidade");
CREATE INDEX IF NOT EXISTS "Profissional_verified_idx" ON "Profissional"("verified");
CREATE INDEX IF NOT EXISTS "Profissional_disponivelAgora_idx" ON "Profissional"("disponivelAgora");

-- Clinica
CREATE INDEX IF NOT EXISTS "Clinica_zonaLuanda_idx" ON "Clinica"("zonaLuanda");
CREATE INDEX IF NOT EXISTS "Clinica_verified_idx" ON "Clinica"("verified");

-- Plantao (Turno)
CREATE INDEX IF NOT EXISTS "Plantao_clinicaId_idx" ON "Plantao"("clinicaId");
CREATE INDEX IF NOT EXISTS "Plantao_especialidade_idx" ON "Plantao"("especialidade");
CREATE INDEX IF NOT EXISTS "Plantao_tipoProfissional_idx" ON "Plantao"("tipoProfissional");
CREATE INDEX IF NOT EXISTS "Plantao_dataInicio_idx" ON "Plantao"("dataInicio");
CREATE INDEX IF NOT EXISTS "Plantao_estado_idx" ON "Plantao"("estado");

-- Candidatura
CREATE INDEX IF NOT EXISTS "Candidatura_plantaoId_idx" ON "Candidatura"("plantaoId");
CREATE INDEX IF NOT EXISTS "Candidatura_profissionalId_idx" ON "Candidatura"("profissionalId");
CREATE INDEX IF NOT EXISTS "Candidatura_estado_idx" ON "Candidatura"("estado");

-- Sala
CREATE INDEX IF NOT EXISTS "Sala_clinicaId_idx" ON "Sala"("clinicaId");
CREATE INDEX IF NOT EXISTS "Sala_tipo_idx" ON "Sala"("tipo");
CREATE INDEX IF NOT EXISTS "Sala_ativo_idx" ON "Sala"("ativo");

-- ReservaSala
CREATE INDEX IF NOT EXISTS "ReservaSala_salaId_idx" ON "ReservaSala"("salaId");
CREATE INDEX IF NOT EXISTS "ReservaSala_profissionalId_idx" ON "ReservaSala"("profissionalId");
CREATE INDEX IF NOT EXISTS "ReservaSala_estado_idx" ON "ReservaSala"("estado");

-- Avaliacao
CREATE INDEX IF NOT EXISTS "Avaliacao_autorId_idx" ON "Avaliacao"("autorId");
CREATE INDEX IF NOT EXISTS "Avaliacao_alvoClinicaId_idx" ON "Avaliacao"("alvoClinicaId");
CREATE INDEX IF NOT EXISTS "Avaliacao_alvoMedicoId_idx" ON "Avaliacao"("alvoMedicoId");
CREATE INDEX IF NOT EXISTS "Avaliacao_plantaoId_idx" ON "Avaliacao"("plantaoId");

-- Credencial
CREATE INDEX IF NOT EXISTS "Credencial_profissionalId_idx" ON "Credencial"("profissionalId");
CREATE INDEX IF NOT EXISTS "Credencial_estado_idx" ON "Credencial"("estado");

-- TransacaoCarteira
CREATE INDEX IF NOT EXISTS "TransacaoCarteira_profissionalId_idx" ON "TransacaoCarteira"("profissionalId");
CREATE INDEX IF NOT EXISTS "TransacaoCarteira_tipo_idx" ON "TransacaoCarteira"("tipo");
CREATE INDEX IF NOT EXISTS "TransacaoCarteira_criadoEm_idx" ON "TransacaoCarteira"("criadoEm");

-- Notificacao
CREATE INDEX IF NOT EXISTS "Notificacao_userId_idx" ON "Notificacao"("userId");
CREATE INDEX IF NOT EXISTS "Notificacao_lida_idx" ON "Notificacao"("lida");
