-- Performance indexes
-- Sala: compound index covers WHERE disponivel=true [AND zona=X] ORDER BY avaliacaoMedia
CREATE INDEX IF NOT EXISTS "Sala_disponivel_zona_idx" ON "Sala"("disponivel", "zona");

-- Plantao: compound index covers WHERE estado='ABERTO' ORDER BY dataInicio (main public listing)
DROP INDEX IF EXISTS "Plantao_estado_idx";
DROP INDEX IF EXISTS "Plantao_dataInicio_idx";
CREATE INDEX IF NOT EXISTS "Plantao_estado_dataInicio_idx" ON "Plantao"("estado", "dataInicio");

-- ReservaSala: compound index covers WHERE profissionalId=X ORDER BY criadoEm DESC
DROP INDEX IF EXISTS "ReservaSala_profissionalId_idx";
CREATE INDEX IF NOT EXISTS "ReservaSala_profissionalId_criadoEm_idx" ON "ReservaSala"("profissionalId", "criadoEm" DESC);

-- Notificacao: compound index covers WHERE userId=X ORDER BY criadoEm DESC
DROP INDEX IF EXISTS "Notificacao_userId_idx";
DROP INDEX IF EXISTS "Notificacao_lida_idx";
CREATE INDEX IF NOT EXISTS "Notificacao_userId_criadoEm_idx" ON "Notificacao"("userId", "criadoEm" DESC);
