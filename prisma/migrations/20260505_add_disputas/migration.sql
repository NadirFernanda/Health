-- Add missing metrics column to Profissional (was in schema but missing from migrations)
ALTER TABLE "Profissional" ADD COLUMN IF NOT EXISTS "metrics" JSONB DEFAULT '{}';

-- CreateEnum (idempotent via DO...EXCEPTION for PG < 14 compatibility)
DO $$ BEGIN
  CREATE TYPE "DisputaTipo" AS ENUM ('NAO_COMPARECEU', 'NAO_PAGOU', 'QUALIDADE', 'CANCELAMENTO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DisputaEstado" AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'ENCERRADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Disputa" (
    "id" TEXT NOT NULL,
    "candidaturaId" TEXT NOT NULL,
    "iniciadoPorId" TEXT NOT NULL,
    "tipo" "DisputaTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "estado" "DisputaEstado" NOT NULL DEFAULT 'ABERTA',
    "resolucaoNota" TEXT,
    "ajusteValorKz" INTEGER,
    "ajusteParaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "Disputa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DisputaMensagem" (
    "id" TEXT NOT NULL,
    "disputaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputaMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Disputa_candidaturaId_idx" ON "Disputa"("candidaturaId");
CREATE INDEX IF NOT EXISTS "Disputa_estado_idx" ON "Disputa"("estado");
CREATE INDEX IF NOT EXISTS "Disputa_criadoEm_idx" ON "Disputa"("criadoEm");
CREATE INDEX IF NOT EXISTS "DisputaMensagem_disputaId_idx" ON "DisputaMensagem"("disputaId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Disputa" ADD CONSTRAINT "Disputa_candidaturaId_fkey"
    FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Disputa" ADD CONSTRAINT "Disputa_iniciadoPorId_fkey"
    FOREIGN KEY ("iniciadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DisputaMensagem" ADD CONSTRAINT "DisputaMensagem_disputaId_fkey"
    FOREIGN KEY ("disputaId") REFERENCES "Disputa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DisputaMensagem" ADD CONSTRAINT "DisputaMensagem_autorId_fkey"
    FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
