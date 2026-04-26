-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEDICO', 'CLINICA', 'PROFISSIONAL', 'PROPRIETARIO_SALA');

-- CreateEnum
CREATE TYPE "TipoProfissional" AS ENUM ('MEDICO', 'ENFERMEIRO', 'TECNICO_SAUDE');

-- CreateEnum
CREATE TYPE "EstadoPlantao" AS ENUM ('ABERTO', 'FECHADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCandidatura" AS ENUM ('PENDENTE', 'ACEITE', 'RECUSADO', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('NAO_ENVIADO', 'PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "EstadoTransacao" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONFIRMADO', 'PROCESSADO', 'FALHOU', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoSala" AS ENUM ('CONSULTORIO', 'OBSERVACAO', 'PROCEDIMENTOS', 'SALA_CURATIVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDENTE_PAGAMENTO', 'CONFIRMADA', 'CANCELADA', 'CANCELADA_PROFISSIONAL', 'CANCELADA_CLINICA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "CredencialTipo" AS ENUM ('BI_PASSAPORTE', 'CEDULA_OMA', 'REGISTO_SINOME', 'DIPLOMA_LICENCIATURA', 'CERTIFICADO_ESPECIALIZACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CredencialEstado" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'EXPRESS_PENDENTE');

-- CreateEnum
CREATE TYPE "PagamentoTipo" AS ENUM ('TURNO', 'SALA');

-- CreateEnum
CREATE TYPE "PagamentoMetodo" AS ENUM ('MULTICAIXA_EXPRESS', 'TRANSFERENCIA_BANCARIA', 'TPA');

-- CreateEnum
CREATE TYPE "PagamentoEstado" AS ENUM ('PENDENTE', 'PROCESSANDO', 'CONFIRMADO', 'FALHOU', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "AvaliacaoTipo" AS ENUM ('TURNO', 'SALA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedEm" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoProfissional" NOT NULL DEFAULT 'MEDICO',
    "especialidade" TEXT NOT NULL,
    "numeroOrdem" TEXT,
    "numeroSinome" TEXT,
    "numeroOma" TEXT,
    "provincia" TEXT NOT NULL DEFAULT 'Luanda',
    "cidade" TEXT,
    "bairro" TEXT,
    "foto" TEXT,
    "bio" TEXT,
    "anosExperiencia" INTEGER,
    "subEspecialidade" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,
    "totalPlantoes" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificadoEm" TIMESTAMP(3),
    "saldoCarteira" INTEGER NOT NULL DEFAULT 0,
    "saldoCarteiraCentavos" BIGINT NOT NULL DEFAULT 0,
    "disponivelAgora" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "alvara" TEXT,
    "morada" TEXT,
    "bairro" TEXT,
    "zonaLuanda" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "contacto" TEXT,
    "website" TEXT,
    "cidade" TEXT,
    "provincia" TEXT NOT NULL DEFAULT 'Luanda',
    "logo" TEXT,
    "descricao" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "updatedEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plantao" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "valorKwanzas" INTEGER NOT NULL,
    "valorCentavos" BIGINT,
    "vagas" INTEGER NOT NULL,
    "vagasPreenchidas" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoPlantao" NOT NULL DEFAULT 'ABERTO',
    "descricao" TEXT,
    "maca" BOOLEAN NOT NULL DEFAULT false,
    "estetoscopio" BOOLEAN NOT NULL DEFAULT false,
    "tensiometro" BOOLEAN NOT NULL DEFAULT false,
    "termometro" BOOLEAN NOT NULL DEFAULT false,
    "computador" BOOLEAN NOT NULL DEFAULT false,
    "materiaisBasicos" BOOLEAN NOT NULL DEFAULT true,
    "nebulizador" BOOLEAN NOT NULL DEFAULT false,
    "oximetro" BOOLEAN NOT NULL DEFAULT false,
    "glucometro" BOOLEAN NOT NULL DEFAULT false,
    "desfibrilador" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plantao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidatura" (
    "id" TEXT NOT NULL,
    "plantaoId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "estado" "EstadoCandidatura" NOT NULL DEFAULT 'PENDENTE',
    "mensagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEm" TIMESTAMP(3),

    CONSTRAINT "Candidatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" TEXT,
    "tipo" "TipoSala" NOT NULL,
    "precoPorHora" INTEGER NOT NULL,
    "precoPorHoraCentavos" BIGINT,
    "zona" TEXT NOT NULL,
    "descricao" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "politicaCancel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "avaliacaoMedia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAvaliacoes" INTEGER NOT NULL DEFAULT 0,
    "maca" BOOLEAN NOT NULL DEFAULT false,
    "estetoscopio" BOOLEAN NOT NULL DEFAULT false,
    "tensiometro" BOOLEAN NOT NULL DEFAULT false,
    "termometro" BOOLEAN NOT NULL DEFAULT false,
    "computador" BOOLEAN NOT NULL DEFAULT false,
    "materiaisBasicos" BOOLEAN NOT NULL DEFAULT true,
    "nebulizador" BOOLEAN NOT NULL DEFAULT false,
    "oximetro" BOOLEAN NOT NULL DEFAULT false,
    "glucometro" BOOLEAN NOT NULL DEFAULT false,
    "desfibrilador" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaSala" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "horaInicio" TEXT NOT NULL,
    "duracaoHoras" INTEGER NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "valorTotalCentavos" BIGINT,
    "comissaoAoa" INTEGER,
    "valorClinicaAoa" INTEGER,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "codigoQr" TEXT NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservaSala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "tipo" "AvaliacaoTipo",
    "autorId" TEXT,
    "alvoMedicoId" TEXT,
    "alvoClinicaId" TEXT,
    "salaId" TEXT,
    "plantaoId" TEXT,
    "avaliadorUserId" TEXT,
    "avaliadoUserId" TEXT,
    "avaliadoRole" TEXT,
    "estrelas" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credencial" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" "CredencialTipo" NOT NULL,
    "ficheiroUrl" TEXT,
    "ficheiroNome" TEXT,
    "ficheiroTamanho" INTEGER,
    "estado" "CredencialEstado" NOT NULL DEFAULT 'PENDENTE',
    "express" BOOLEAN NOT NULL DEFAULT false,
    "comentario" TEXT,
    "verificadoPorId" TEXT,
    "verificadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisponibilidadeSala" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisponibilidadeSala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "tipo" "PagamentoTipo" NOT NULL,
    "plantaoId" TEXT,
    "candidaturaId" TEXT,
    "reservaSalaId" TEXT,
    "valorBrutoAoa" INTEGER NOT NULL,
    "comissaoAoa" INTEGER NOT NULL,
    "valorLiquidoAoa" INTEGER NOT NULL,
    "metodo" "PagamentoMetodo" NOT NULL,
    "estado" "PagamentoEstado" NOT NULL DEFAULT 'PENDENTE',
    "referenciaExt" TEXT,
    "webhookPayload" JSONB,
    "pagoEm" TIMESTAMP(3),
    "liberadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ficheiro" TEXT,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'NAO_ENVIADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransacaoCarteira" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "valor" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "estado" "EstadoTransacao" NOT NULL DEFAULT 'PROCESSADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoCarteira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "href" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_userId_key" ON "Profissional"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinica_userId_key" ON "Clinica"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidatura_plantaoId_profissionalId_key" ON "Candidatura"("plantaoId", "profissionalId");

-- CreateIndex
CREATE INDEX "DisponibilidadeSala_salaId_diaSemana_idx" ON "DisponibilidadeSala"("salaId", "diaSemana");

-- CreateIndex
CREATE INDEX "Pagamento_candidaturaId_idx" ON "Pagamento"("candidaturaId");

-- CreateIndex
CREATE INDEX "Pagamento_reservaSalaId_idx" ON "Pagamento"("reservaSalaId");

-- CreateIndex
CREATE INDEX "Pagamento_estado_idx" ON "Pagamento"("estado");

-- CreateIndex
CREATE INDEX "Pagamento_referenciaExt_idx" ON "Pagamento"("referenciaExt");

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clinica" ADD CONSTRAINT "Clinica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plantao" ADD CONSTRAINT "Plantao_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidatura" ADD CONSTRAINT "Candidatura_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES "Plantao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidatura" ADD CONSTRAINT "Candidatura_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaSala" ADD CONSTRAINT "ReservaSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservaSala" ADD CONSTRAINT "ReservaSala_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_alvoMedicoId_fkey" FOREIGN KEY ("alvoMedicoId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_alvoClinicaId_fkey" FOREIGN KEY ("alvoClinicaId") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES "Plantao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credencial" ADD CONSTRAINT "Credencial_verificadoPorId_fkey" FOREIGN KEY ("verificadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisponibilidadeSala" ADD CONSTRAINT "DisponibilidadeSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES "Plantao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES "Candidatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_reservaSalaId_fkey" FOREIGN KEY ("reservaSalaId") REFERENCES "ReservaSala"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransacaoCarteira" ADD CONSTRAINT "TransacaoCarteira_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

