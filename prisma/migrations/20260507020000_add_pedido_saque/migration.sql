-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EstadoSaque" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PedidoSaque" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "valorAoa" INTEGER NOT NULL,
    "valorCentavos" BIGINT NOT NULL,
    "dadosBancarios" JSONB NOT NULL,
    "estado" "EstadoSaque" NOT NULL DEFAULT 'PENDENTE',
    "motivoRejeicao" TEXT,
    "adminId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),

    CONSTRAINT "PedidoSaque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PedidoSaque_profissionalId_idx" ON "PedidoSaque"("profissionalId");
CREATE INDEX IF NOT EXISTS "PedidoSaque_estado_idx" ON "PedidoSaque"("estado");
CREATE INDEX IF NOT EXISTS "PedidoSaque_criadoEm_idx" ON "PedidoSaque"("criadoEm");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PedidoSaque" ADD CONSTRAINT "PedidoSaque_profissionalId_fkey"
    FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
