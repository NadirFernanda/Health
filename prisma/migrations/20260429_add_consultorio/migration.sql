-- Criar tabela Consultorio
CREATE TABLE "Consultorio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "morada" TEXT,
    "bairro" TEXT,
    "zonaLuanda" TEXT,
    "contacto" TEXT,
    "cidade" TEXT,
    "provincia" TEXT NOT NULL DEFAULT 'Luanda',
    "descricao" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultorio_pkey" PRIMARY KEY ("id")
);

-- Unique e índices
CREATE UNIQUE INDEX "Consultorio_userId_key" ON "Consultorio"("userId");
CREATE INDEX "Consultorio_zonaLuanda_idx" ON "Consultorio"("zonaLuanda");
CREATE INDEX "Consultorio_verified_idx" ON "Consultorio"("verified");

-- FK para User
ALTER TABLE "Consultorio" ADD CONSTRAINT "Consultorio_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tornar Sala.clinicaId opcional e adicionar consultorioId
ALTER TABLE "Sala" ALTER COLUMN "clinicaId" DROP NOT NULL;
ALTER TABLE "Sala" ADD COLUMN "consultorioId" TEXT;
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_consultorioId_fkey"
    FOREIGN KEY ("consultorioId") REFERENCES "Consultorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Sala_consultorioId_idx" ON "Sala"("consultorioId");
