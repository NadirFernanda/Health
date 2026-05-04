-- CreateTable Mensagem
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "candidaturaId" TEXT NOT NULL,
    "autorUserId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Mensagem on candidaturaId
CREATE INDEX "Mensagem_candidaturaId_idx" ON "Mensagem"("candidaturaId");

-- CreateIndex Mensagem on autorUserId
CREATE INDEX "Mensagem_autorUserId_idx" ON "Mensagem"("autorUserId");

-- AddForeignKey Mensagem
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Mensagem
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_autorUserId_fkey" FOREIGN KEY ("autorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddColumn Profissional
ALTER TABLE "Profissional" ADD COLUMN "rejeicaoMotivo" TEXT;
