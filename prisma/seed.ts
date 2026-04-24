import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as never);
const ROUNDS = 10;

async function main() {
  console.log("🌱 A criar base de dados...");

  // ── Limpar dados existentes ──────────────────────────────────────────────
  await prisma.notificacao.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.transacaoCarteira.deleteMany();
  await prisma.reservaSala.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.candidatura.deleteMany();
  await prisma.plantao.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.clinica.deleteMany();
  await prisma.user.deleteMany();

  // ── Utilizadores ─────────────────────────────────────────────────────────
  const adminHash = bcrypt.hashSync("planto@admin2025", ROUNDS);
  const medicoHash = bcrypt.hashSync("med123456", ROUNDS);
  const clinicaHash = bcrypt.hashSync("cli123456", ROUNDS);

  const admin = await prisma.user.create({
    data: { email: "admin@plantoamed.ao", passwordHash: adminHash, role: "ADMIN" },
  });

  const userMedico = await prisma.user.create({
    data: { email: "medico@plantoamed.ao", passwordHash: medicoHash, role: "MEDICO" },
  });

  const userClinicaHorizonte = await prisma.user.create({
    data: { email: "clinica@horizonte.ao", passwordHash: clinicaHash, role: "CLINICA" },
  });
  const userClinicaSaude = await prisma.user.create({
    data: { email: "clinica@saudemais.ao", passwordHash: clinicaHash, role: "CLINICA" },
  });
  const userClinicaCentral = await prisma.user.create({
    data: { email: "clinica@central.ao", passwordHash: clinicaHash, role: "CLINICA" },
  });

  // Médicos extra (candidatos)
  const userMed2 = await prisma.user.create({
    data: { email: "ana.ferreira@medfreela.ao", passwordHash: medicoHash, role: "MEDICO" },
  });
  const userMed3 = await prisma.user.create({
    data: { email: "maria.costa@medfreela.ao", passwordHash: medicoHash, role: "MEDICO" },
  });

  console.log(`  ✓ ${[admin, userMedico, userClinicaHorizonte, userClinicaSaude, userClinicaCentral, userMed2, userMed3].length} utilizadores criados`);

  // ── Profissional principal ────────────────────────────────────────────────
  const medico = await prisma.profissional.create({
    data: {
      userId: userMedico.id,
      nome: "Dr. João Silva",
      tipo: "MEDICO",
      especialidade: "Medicina Geral",
      numeroOrdem: "OA-LDA-2019-0042",
      numeroSinome: "SINOME-LDA-2019-0042",
      provincia: "Luanda",
      bio: "Médico geral com 7 anos de experiência, especializado em urgência básica e consulta externa.",
      rating: 4.8,
      totalAvaliacoes: 23,
      totalPlantoes: 41,
      verified: true,
      saldoCarteira: 45000,
      disponivelAgora: false,
    },
  });

  const med2 = await prisma.profissional.create({
    data: {
      userId: userMed2.id,
      nome: "Dra. Ana Ferreira Neto",
      tipo: "MEDICO",
      especialidade: "Medicina Geral",
      numeroOrdem: "OA-LDA-2019-0412",
      numeroSinome: "SINOME-LDA-2019-0412",
      rating: 4.8,
      totalAvaliacoes: 23,
      totalPlantoes: 41,
      verified: true,
    },
  });

  const med3 = await prisma.profissional.create({
    data: {
      userId: userMed3.id,
      nome: "Enf.ª Maria Costa",
      tipo: "ENFERMEIRO",
      especialidade: "Enfermagem Geral",
      numeroOrdem: "OE-LDA-2020-0188",
      numeroSinome: "SINOME-LDA-2020-0188",
      rating: 4.3,
      totalAvaliacoes: 11,
      totalPlantoes: 18,
      verified: true,
    },
  });

  console.log("  ✓ 3 profissionais criados");

  // ── Documentos do médico ──────────────────────────────────────────────────
  await prisma.documento.createMany({
    data: [
      { profissionalId: medico.id, tipo: "Bilhete de Identidade (BI)", estado: "APROVADO" },
      { profissionalId: medico.id, tipo: "Carta de Membro — Ordem dos Médicos", estado: "APROVADO" },
      { profissionalId: medico.id, tipo: "Registo SINOME / Ministério da Saúde", estado: "APROVADO" },
      { profissionalId: medico.id, tipo: "Diploma de Medicina", estado: "PENDENTE" },
      { profissionalId: medico.id, tipo: "Certificado de Especialidade (se aplicável)", estado: "NAO_ENVIADO" },
    ],
  });

  // ── Clínicas ──────────────────────────────────────────────────────────────
  const horizonte = await prisma.clinica.create({
    data: {
      userId: userClinicaHorizonte.id,
      nome: "Clínica Horizonte",
      morada: "Rua da Saúde, Nº 12",
      cidade: "Centralidade Horizonte",
      provincia: "Luanda",
      rating: 4.7,
      totalAvaliacoes: 38,
      verified: true,
    },
  });

  const saudeMais = await prisma.clinica.create({
    data: {
      userId: userClinicaSaude.id,
      nome: "Clínica Saúde+",
      morada: "Av. Miramar, Nº 45",
      cidade: "Miramar",
      provincia: "Luanda",
      rating: 4.2,
      totalAvaliacoes: 19,
      verified: true,
    },
  });

  const central = await prisma.clinica.create({
    data: {
      userId: userClinicaCentral.id,
      nome: "Clínica Central",
      morada: "Rua dos Médicos, Nº 8",
      cidade: "Talatona",
      provincia: "Luanda",
      rating: 4.5,
      totalAvaliacoes: 27,
      verified: true,
    },
  });

  console.log("  ✓ 3 clínicas criadas");

  // ── Plantões ──────────────────────────────────────────────────────────────
  const equip = {
    maca: true, estetoscopio: true, tensiometro: true, termometro: true,
    computador: true, materiaisBasicos: true, nebulizador: false,
    oximetro: true, glucometro: false, desfibrilador: false,
  };

  const plt1 = await prisma.plantao.create({
    data: {
      clinicaId: horizonte.id,
      especialidade: "Medicina Geral",
      dataInicio: new Date("2026-04-24T08:00:00"),
      dataFim: new Date("2026-04-24T20:00:00"),
      valorKwanzas: 15000,
      vagas: 2,
      descricao: "Urgência básica com consulta externa. Atendimento adultos e crianças. Necessário pontualidade.",
      ...equip,
    },
  });

  const plt2 = await prisma.plantao.create({
    data: {
      clinicaId: saudeMais.id,
      especialidade: "Medicina Geral",
      dataInicio: new Date("2026-04-26T20:00:00"),
      dataFim: new Date("2026-04-27T08:00:00"),
      valorKwanzas: 20000,
      vagas: 1,
      descricao: "Plantão noturno de urgência. Experiência em medicina de urgência preferencial.",
      ...equip,
      computador: false,
      oximetro: false,
    },
  });

  const plt3 = await prisma.plantao.create({
    data: {
      clinicaId: central.id,
      especialidade: "Pediatria",
      dataInicio: new Date("2026-04-25T08:00:00"),
      dataFim: new Date("2026-04-25T20:00:00"),
      valorKwanzas: 18000,
      vagas: 1,
      descricao: "Consulta externa pediátrica. Experiência com crianças obrigatória.",
      ...equip,
      nebulizador: true,
    },
  });

  const plt4 = await prisma.plantao.create({
    data: {
      clinicaId: horizonte.id,
      especialidade: "Medicina Geral",
      dataInicio: new Date("2026-04-28T08:00:00"),
      dataFim: new Date("2026-04-28T20:00:00"),
      valorKwanzas: 15000,
      vagas: 1,
      descricao: "Consulta externa geral. Atendimento adultos.",
      ...equip,
    },
  });

  console.log("  ✓ 4 plantões criados");

  // ── Candidaturas ──────────────────────────────────────────────────────────
  await prisma.candidatura.create({
    data: { plantaoId: plt1.id, profissionalId: medico.id, estado: "ACEITE" },
  });
  await prisma.candidatura.create({
    data: { plantaoId: plt2.id, profissionalId: medico.id, estado: "PENDENTE" },
  });
  await prisma.candidatura.create({
    data: { plantaoId: plt3.id, profissionalId: medico.id, estado: "RECUSADO" },
  });

  // Candidaturas de outros médicos nos plantões da clínica Horizonte
  await prisma.candidatura.create({
    data: { plantaoId: plt4.id, profissionalId: med2.id, estado: "PENDENTE" },
  });
  await prisma.candidatura.create({
    data: { plantaoId: plt4.id, profissionalId: med3.id, estado: "PENDENTE" },
  });

  console.log("  ✓ 5 candidaturas criadas");

  // ── Transações ────────────────────────────────────────────────────────────
  await prisma.transacaoCarteira.createMany({
    data: [
      { profissionalId: medico.id, tipo: "CREDITO", valor: 15000, descricao: "Plantão — Clínica Horizonte", estado: "PROCESSADO" },
      { profissionalId: medico.id, tipo: "CREDITO", valor: 20000, descricao: "Plantão noturno — Clínica Saúde+", estado: "PROCESSADO" },
      { profissionalId: medico.id, tipo: "DEBITO",  valor: 10000, descricao: "Levantamento — Multicaixa Express", estado: "PROCESSADO" },
      { profissionalId: medico.id, tipo: "CREDITO", valor: 15000, descricao: "Plantão — Clínica Central", estado: "PROCESSADO" },
      { profissionalId: medico.id, tipo: "CREDITO", valor: 15000, descricao: "Plantão — Clínica Horizonte (em processamento)", estado: "PENDENTE" },
    ],
  });

  // ── Salas ─────────────────────────────────────────────────────────────────
  const sala1 = await prisma.sala.create({
    data: {
      clinicaId: horizonte.id,
      nome: "Consultório A",
      tipo: "CONSULTORIO",
      precoPorHora: 5000,
      zona: "Centralidade Horizonte",
      descricao: "Consultório completo com maca, computador com acesso ao sistema. Ideal para consultas de clínica geral. Climatizado e com WC privativo.",
      avaliacaoMedia: 4.8,
      totalAvaliacoes: 14,
      ...equip,
    },
  });

  const sala2 = await prisma.sala.create({
    data: {
      clinicaId: horizonte.id,
      nome: "Consultório B",
      tipo: "CONSULTORIO",
      precoPorHora: 4500,
      zona: "Centralidade Horizonte",
      descricao: "Consultório equipado para consultas gerais. Sem sistema informático integrado.",
      avaliacaoMedia: 4.5,
      totalAvaliacoes: 8,
      ...equip,
      computador: false,
    },
  });

  const sala3 = await prisma.sala.create({
    data: {
      clinicaId: saudeMais.id,
      nome: "Sala de Observação",
      tipo: "OBSERVACAO",
      precoPorHora: 3500,
      zona: "Miramar",
      descricao: "Sala de observação com maca articulada e monitorização básica.",
      avaliacaoMedia: 4.3,
      totalAvaliacoes: 6,
      ...equip,
      nebulizador: true,
      oximetro: true,
    },
  });

  await prisma.sala.create({
    data: {
      clinicaId: central.id,
      nome: "Sala de Procedimentos",
      tipo: "PROCEDIMENTOS",
      precoPorHora: 6000,
      zona: "Talatona",
      descricao: "Sala totalmente equipada para procedimentos menores e consultas especializadas.",
      avaliacaoMedia: 4.9,
      totalAvaliacoes: 22,
      ...equip,
      desfibrilador: true,
      oximetro: true,
      glucometro: true,
    },
  });

  // ── Reservas de sala ──────────────────────────────────────────────────────
  await prisma.reservaSala.createMany({
    data: [
      {
        salaId: sala1.id,
        profissionalId: medico.id,
        data: new Date("2026-04-26T09:00:00"),
        horaInicio: "09:00",
        duracaoHoras: 4,
        valorTotal: 20000,
        estado: "CONFIRMADA",
      },
      {
        salaId: sala2.id,
        profissionalId: medico.id,
        data: new Date("2026-04-28T14:00:00"),
        horaInicio: "14:00",
        duracaoHoras: 2,
        valorTotal: 9000,
        estado: "CONFIRMADA",
      },
      {
        salaId: sala3.id,
        profissionalId: medico.id,
        data: new Date("2026-04-20T10:00:00"),
        horaInicio: "10:00",
        duracaoHoras: 3,
        valorTotal: 10500,
        estado: "CONCLUIDA",
      },
    ],
  });

  console.log("  ✓ 4 salas + 3 reservas criadas");

  // ── Notificações do médico ────────────────────────────────────────────────
  await prisma.notificacao.createMany({
    data: [
      {
        userId: userMedico.id,
        tipo: "CANDIDATURA_ACEITE",
        titulo: "Candidatura Aceite! 🎉",
        corpo: "A Clínica Horizonte aceitou a sua candidatura para o turno de Medicina Geral dia 26/04.",
        href: `/medico/plantoes/${plt1.id}`,
        lida: false,
        criadoEm: new Date("2026-04-24T09:30:00"),
      },
      {
        userId: userMedico.id,
        tipo: "TURNO_AMANHA",
        titulo: "Lembrete: Turno Amanhã",
        corpo: "Tem um turno marcado para amanhã, 25/04 às 08:00 na Clínica Central.",
        href: `/medico/plantoes/${plt2.id}`,
        lida: false,
        criadoEm: new Date("2026-04-24T07:00:00"),
      },
      {
        userId: userMedico.id,
        tipo: "PAGAMENTO_PROCESSADO",
        titulo: "Pagamento Recebido",
        corpo: "Foi creditado 15.000 AOA na sua carteira referente ao turno de 20/04.",
        href: "/medico/ganhos",
        lida: false,
        criadoEm: new Date("2026-04-22T14:00:00"),
      },
      {
        userId: userMedico.id,
        tipo: "RESERVA_CONFIRMADA",
        titulo: "Reserva de Sala Confirmada",
        corpo: "A sua reserva do Consultório A (Clínica Horizonte) para 26/04 às 09:00 foi confirmada.",
        href: "/medico/minhas-reservas",
        lida: true,
        criadoEm: new Date("2026-04-23T10:15:00"),
      },
      {
        userId: userMedico.id,
        tipo: "AVALIACAO_RECEBIDA",
        titulo: "Nova Avaliação ⭐⭐⭐⭐⭐",
        corpo: "A Clínica Horizonte avaliou o seu desempenho com 5 estrelas.",
        href: "/medico/perfil",
        lida: true,
        criadoEm: new Date("2026-04-21T16:30:00"),
      },
    ],
  });

  // ── Notificações da clínica ───────────────────────────────────────────────
  await prisma.notificacao.createMany({
    data: [
      {
        userId: userClinicaHorizonte.id,
        tipo: "CANDIDATURA_RECEBIDA",
        titulo: "Nova Candidatura Recebida",
        corpo: "Dr. João Silva candidatou-se ao turno de Medicina Geral de 26/04.",
        href: `/clinica/plantoes/${plt4.id}`,
        lida: false,
        criadoEm: new Date("2026-04-24T08:45:00"),
      },
      {
        userId: userClinicaHorizonte.id,
        tipo: "RESERVA_SALA",
        titulo: "Nova Reserva de Sala",
        corpo: "O Consultório A foi reservado para 26/04 às 09:00 (4h). Receberá 17.000 AOA.",
        href: `/clinica/salas/${sala1.id}`,
        lida: false,
        criadoEm: new Date("2026-04-23T10:15:00"),
      },
      {
        userId: userClinicaHorizonte.id,
        tipo: "PAGAMENTO_PENDENTE",
        titulo: "Pagamento Pendente",
        corpo: "O turno de 20/04 com Dr.ª Ana Ferreira ainda não foi pago.",
        href: "/clinica/faturacao",
        lida: true,
        criadoEm: new Date("2026-04-21T09:00:00"),
      },
    ],
  });

  console.log("  ✓ 8 notificações criadas");
  console.log("\n✅ Seed concluído com sucesso!\n");
  console.log("Credenciais de acesso:");
  console.log("  Admin   → admin@plantoamed.ao     / planto@admin2025");
  console.log("  Médico  → medico@plantoamed.ao    / med123456");
  console.log("  Clínica → clinica@horizonte.ao    / cli123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
