-- DropForeignKey
ALTER TABLE "Plantao" DROP CONSTRAINT "Plantao_clinicaId_fkey";

-- DropIndex
DROP INDEX "Plantao_profissionalPublicadorId_idx";

-- DropIndex
DROP INDEX "Plantao_publicadoPorMedico_idx";

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "beneficiarioProfissionalId" TEXT;

-- AlterTable
ALTER TABLE "TransacaoCarteira" ALTER COLUMN "valorCentavos" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Pagamento_beneficiarioProfissionalId_idx" ON "Pagamento"("beneficiarioProfissionalId");

-- AddForeignKey
ALTER TABLE "Plantao" ADD CONSTRAINT "Plantao_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_beneficiarioProfissionalId_fkey" FOREIGN KEY ("beneficiarioProfissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
