-- Passo 1: criar registos de TransacaoCarteira em falta
INSERT INTO "TransacaoCarteira"
  (id, "profissionalId", tipo, "valorCentavos", descricao, referencia, estado, "criadoEm")
SELECT
  gen_random_uuid()::text,
  p."beneficiarioProfissionalId",
  'CREDITO',
  p."valorLiquidoAoa"::bigint * 100,
  'Plantao concluido',
  p."plantaoId",
  'PROCESSADO',
  NOW()
FROM "Pagamento" p
WHERE p."liberadoEm" IS NOT NULL
  AND p."beneficiarioProfissionalId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "TransacaoCarteira" tc
    WHERE tc."profissionalId" = p."beneficiarioProfissionalId"
      AND tc.referencia = p."plantaoId"
  );

-- Passo 2: recalcular saldoCarteira a partir das transacoes
UPDATE "Profissional" prof
SET
  "saldoCarteira"         = COALESCE(sub.total_aoa, 0),
  "saldoCarteiraCentavos" = COALESCE(sub.total_centavos, 0)
FROM (
  SELECT
    "profissionalId",
    SUM("valorCentavos"::bigint / 100) AS total_aoa,
    SUM("valorCentavos"::bigint)       AS total_centavos
  FROM "TransacaoCarteira"
  WHERE tipo = 'CREDITO' AND estado = 'PROCESSADO'
  GROUP BY "profissionalId"
) sub
WHERE prof.id = sub."profissionalId";

-- Passo 3: mostrar resultado
SELECT prof.nome, prof."saldoCarteira", COUNT(tc.id) AS transacoes
FROM "Profissional" prof
LEFT JOIN "TransacaoCarteira" tc ON tc."profissionalId" = prof.id
WHERE prof."saldoCarteira" > 0
GROUP BY prof.nome, prof."saldoCarteira";
