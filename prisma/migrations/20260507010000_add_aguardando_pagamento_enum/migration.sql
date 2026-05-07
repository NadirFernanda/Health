-- Add AGUARDANDO_PAGAMENTO to EstadoPlantao (plantao awaits publisher payment before going ABERTO)
ALTER TYPE "EstadoPlantao" ADD VALUE IF NOT EXISTS 'AGUARDANDO_PAGAMENTO' BEFORE 'ABERTO';

-- Add AGUARDANDO_PAGAMENTO to EstadoCandidatura (médico signed contract, awaits taxa de reserva payment)
ALTER TYPE "EstadoCandidatura" ADD VALUE IF NOT EXISTS 'AGUARDANDO_PAGAMENTO' AFTER 'CONTRATO_PENDENTE';
