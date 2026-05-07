-- Recalcular saldoCarteira a partir das TransacaoCarteira (CREDITO + PROCESSADO)
-- e também criar TransacaoCarteira para pagamentos liberados que ainda não a têm.

-- 1. Criar TransacaoCarteira em falta
INSERT INTO "TransacaoCarteira" (id, "profissionalId", tipo, "valorCentavos", descricao, referencia, estado, "criadoEm")
SELECT
  gen_random_uuid()::text,
  p."beneficiarioProfissionalId",
  'CREDITO',
  p."valorLiquidoAoa"::bigint * 100,
  'Plantao concluido (correcao)',
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

-- 2. Recalcular saldoCarteira como soma de todos os CREDITOs PROCESSADOS
UPDATE "Profissional" prof
SET
  "saldoCarteira"         = COALESCE(sub.total_aoa, 0),
  "saldoCarteiraCentavos" = COALESCE(sub.total_centavos, 0)
FROM (
  SELECT
    "profissionalId",
    SUM("valorCentavos"::bigint / 100)   AS total_aoa,
    SUM("valorCentavos"::bigint)         AS total_centavos
  FROM "TransacaoCarteira"
  WHERE tipo = 'CREDITO' AND estado = 'PROCESSADO'
  GROUP BY "profissionalId"
) sub
WHERE prof.id = sub."profissionalId";

-- 3. Mostrar resultado
SELECT prof.id, prof.nome, prof."saldoCarteira", prof."saldoCarteiraCentavos"
FROM "Profissional" prof
WHERE prof."saldoCarteira" > 0;
