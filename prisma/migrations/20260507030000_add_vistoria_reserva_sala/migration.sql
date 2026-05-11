-- Add new EstadoReserva values for the post-use inspection flow
ALTER TYPE "EstadoReserva" ADD VALUE IF NOT EXISTS 'AGUARDANDO_VISTORIA';
ALTER TYPE "EstadoReserva" ADD VALUE IF NOT EXISTS 'DISPUTA_SALA';

-- Add vistoria (inspection) fields to ReservaSala
ALTER TABLE "ReservaSala"
  ADD COLUMN IF NOT EXISTS "terminadoEm"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "vistoriaOk"           BOOLEAN,
  ADD COLUMN IF NOT EXISTS "vistoriaNotas"        TEXT,
  ADD COLUMN IF NOT EXISTS "vistoriaEquipamentos" TEXT,
  ADD COLUMN IF NOT EXISTS "vistoriaEm"           TIMESTAMP(3);
