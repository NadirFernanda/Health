-- CreateEnum
CREATE TYPE "SupportTicketEstado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "SupportTicketPrioridade" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "rejeicaoMotivo" TEXT;

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "estado" "SupportTicketEstado" NOT NULL DEFAULT 'ABERTO',
    "prioridade" "SupportTicketPrioridade" NOT NULL DEFAULT 'NORMAL',
    "userProvidedId" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autorUserId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "isAdminReply" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_estado_idx" ON "SupportTicket"("estado");

-- CreateIndex
CREATE INDEX "SupportTicket_prioridade_idx" ON "SupportTicket"("prioridade");

-- CreateIndex
CREATE INDEX "SupportTicket_criadoEm_idx" ON "SupportTicket"("criadoEm");

-- CreateIndex
CREATE INDEX "SupportTicketReply_ticketId_idx" ON "SupportTicketReply"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketReply_autorUserId_idx" ON "SupportTicketReply"("autorUserId");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketReply" ADD CONSTRAINT "SupportTicketReply_autorUserId_fkey" FOREIGN KEY ("autorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
