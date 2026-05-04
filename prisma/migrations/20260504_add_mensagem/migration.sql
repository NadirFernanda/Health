-- CreateTable Mensagem (idempotent)
CREATE TABLE IF NOT EXISTS "Mensagem" (
    "id" TEXT NOT NULL,
    "candidaturaId" TEXT NOT NULL,
    "autorUserId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "Mensagem_candidaturaId_idx" ON "Mensagem"("candidaturaId");
CREATE INDEX IF NOT EXISTS "Mensagem_autorUserId_idx" ON "Mensagem"("autorUserId");

-- AddForeignKey (idempotent via DO...EXCEPTION)
DO $$ BEGIN
  ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_candidaturaId_fkey"
    FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_autorUserId_fkey"
    FOREIGN KEY ("autorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
