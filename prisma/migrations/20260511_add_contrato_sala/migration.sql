-- Add CONTRATO_PENDENTE state to EstadoReserva enum
ALTER TYPE "EstadoReserva" ADD VALUE IF NOT EXISTS 'CONTRATO_PENDENTE';

-- Add contrato fields to ReservaSala
ALTER TABLE "ReservaSala"
  ADD COLUMN IF NOT EXISTS "contratoGeradoEm"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contratoAssinadoEm" TIMESTAMP(3);
