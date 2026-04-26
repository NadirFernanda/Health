// Dados mockados para demonstração do protótipo

export type Especialidade =
  | "Medicina Geral"
  | "Pediatria"
  | "Ginecologia"
  | "Cardiologia"
  | "Cirurgia"
  | "Ortopedia"
  | "Dermatologia"
  | "Psiquiatria"
  | "Enfermagem Geral"
  | "Enfermagem de Urgência"
  | "Técnico de Análises Clínicas"
  | "Técnico de Radiologia";

export type TipoProfissional = "MEDICO" | "ENFERMEIRO" | "TECNICO_SAUDE" | "OUTRO";

export interface Medico {
  id: string;
  nome: string;
  tipo: TipoProfissional;
  especialidade: Especialidade;
  numeroOrdem: string;
  numeroSinome: string;
  provincia: string;
  foto: string;
  rating: number;
  totalAvaliacoes: number;
  totalPlantoes: number;
  verified: boolean;
  saldoCarteira: number;
  bio: string;
}

export interface Equipamentos {
  maca: boolean;
  estetoscopio: boolean;
  tensiometro: boolean;
  termometro: boolean;
  computador: boolean;
  materiaisBasicos: boolean;
  nebulizador: boolean;
  oximetro: boolean;
  glucometro: boolean;
  desfibrilador: boolean;
}

export interface Clinica {
  id: string;
  nome: string;
  morada: string;
  cidade: string;
  provincia: string;
  logo: string;
  rating: number;
  totalAvaliacoes: number;
  verified: boolean;
}

export interface Plantao {
  id: string;
  clinica: Clinica;
  tipoProfissional: TipoProfissional;
  especialidade: Especialidade;
  dataInicio: string;
  dataFim: string;
  valorKwanzas: number;
  vagas: number;
  vagasPreenchidas: number;
  estado: "ABERTO" | "FECHADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";
  equipamentos: Equipamentos;
  descricao: string;
  candidatos?: number;
}

export interface Candidatura {
  id: string;
  plantao: Plantao;
  estado: "PENDENTE" | "ACEITE" | "RECUSADO";
  criadoEm: string;
}

export interface TransacaoCarteira {
  id: string;
  tipo: "CREDITO" | "DEBITO";
  valorCentavos: bigint;
  descricao: string;
  referencia?: string;
  data: string;
  estado: "PROCESSADO" | "PENDENTE";
}

// --- DADOS MOCK ---

export const medicoLogado: Medico = {
  id: "med-001",
  nome: "Dr. João Silva",
  tipo: "MEDICO",
  especialidade: "Medicina Geral",
  numeroOrdem: "OA-LDA-2019-0042",
  numeroSinome: "SINOME-LDA-2019-0042",
  provincia: "Luanda",
  foto: "",
  rating: 4.8,
  totalAvaliacoes: 23,
  totalPlantoes: 41,
  verified: true,
  saldoCarteira: 45000,
  bio: "Médico geral com 7 anos de experiência, especializado em urgência básica e consulta externa.",
};

export const clinicaLogada: Clinica = {
  id: "cli-001",
  nome: "Clínica Horizonte",
  morada: "Rua da Saúde, Nº 12",
  cidade: "Centralidade Horizonte",
  provincia: "Luanda",
  logo: "",
  rating: 4.6,
  totalAvaliacoes: 38,
  verified: true,
};

export const clinicasMock: Clinica[] = [
  {
    id: "cli-001",
    nome: "Clínica Horizonte",
    morada: "Rua da Saúde, Nº 12",
    cidade: "Centralidade Horizonte",
    provincia: "Luanda",
    logo: "",
    rating: 4.7,
    totalAvaliacoes: 38,
    verified: true,
  },
  {
    id: "cli-002",
    nome: "Clínica Saúde+",
    morada: "Av. Miramar, Nº 45",
    cidade: "Miramar",
    provincia: "Luanda",
    logo: "",
    rating: 4.2,
    totalAvaliacoes: 19,
    verified: true,
  },
  {
    id: "cli-003",
    nome: "Clínica Central",
    morada: "Rua dos Médicos, Nº 8",
    cidade: "Talatona",
    provincia: "Luanda",
    logo: "",
    rating: 4.5,
    totalAvaliacoes: 27,
    verified: true,
  },
];

const equipamentosCompletos: Equipamentos = {
  maca: true,
  estetoscopio: true,
  tensiometro: true,
  termometro: true,
  computador: true,
  materiaisBasicos: true,
  nebulizador: false,
  oximetro: true,
  glucometro: false,
  desfibrilador: false,
};

export const plantoesMock: Plantao[] = [
  {
    id: "pla-001",
    clinica: clinicasMock[0],
    tipoProfissional: "MEDICO",
    especialidade: "Medicina Geral",
    dataInicio: "2026-04-24T08:00:00",
    dataFim: "2026-04-24T20:00:00",
    valorKwanzas: 15000,
    vagas: 2,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: equipamentosCompletos,
    descricao:
      "Urgência básica com consulta externa. Atendimento adultos e crianças. Necessário pontualidade.",
    candidatos: 3,
  },
  {
    id: "pla-002",
    clinica: clinicasMock[1],
    tipoProfissional: "MEDICO",
    especialidade: "Medicina Geral",
    dataInicio: "2026-04-26T20:00:00",
    dataFim: "2026-04-27T08:00:00",
    valorKwanzas: 20000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: { ...equipamentosCompletos, computador: false, oximetro: false },
    descricao: "Plantão noturno de urgência. Experiência em medicina de urgência preferencial.",
    candidatos: 1,
  },
  {
    id: "pla-003",
    clinica: clinicasMock[2],
    tipoProfissional: "MEDICO",
    especialidade: "Pediatria",
    dataInicio: "2026-04-25T08:00:00",
    dataFim: "2026-04-25T20:00:00",
    valorKwanzas: 18000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: { ...equipamentosCompletos, nebulizador: true },
    descricao: "Consulta externa pediátrica. Experiência com crianças obrigatória.",
    candidatos: 0,
  },
  {
    id: "pla-004",
    clinica: clinicasMock[0],
    tipoProfissional: "ENFERMEIRO",
    especialidade: "Enfermagem Geral",
    dataInicio: "2026-04-28T08:00:00",
    dataFim: "2026-04-28T20:00:00",
    valorKwanzas: 12000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: equipamentosCompletos,
    descricao: "Enfermagem de apoio à consulta externa. Atendimento adultos.",
    candidatos: 2,
  },
];

export const candidaturasMock: Candidatura[] = [
  {
    id: "cand-001",
    plantao: { ...plantoesMock[0], estado: "FECHADO" },
    estado: "ACEITE",
    criadoEm: "2026-04-22T10:00:00",
  },
  {
    id: "cand-002",
    plantao: plantoesMock[1],
    estado: "PENDENTE",
    criadoEm: "2026-04-23T09:30:00",
  },
  {
    id: "cand-003",
    plantao: { ...plantoesMock[2], estado: "FECHADO" },
    estado: "RECUSADO",
    criadoEm: "2026-04-21T14:00:00",
  },
];

export const transacoesMock: TransacaoCarteira[] = [
  {
    id: "tx-001",
    tipo: "CREDITO",
    valorCentavos: 1500000n,
    descricao: "Plantão — Clínica Horizonte",
    data: "2026-04-22T20:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-002",
    tipo: "CREDITO",
    valorCentavos: 2000000n,
    descricao: "Plantão noturno — Clínica Saúde+",
    data: "2026-04-18T08:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-003",
    tipo: "DEBITO",
    valorCentavos: 1000000n,
    descricao: "Levantamento — Multicaixa Express",
    referencia: "MCX-2026-0042",
    data: "2026-04-15T11:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-004",
    tipo: "CREDITO",
    valorCentavos: 1500000n,
    descricao: "Plantão — Clínica Central",
    data: "2026-04-10T20:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-005",
    tipo: "CREDITO",
    valorCentavos: 1500000n,
    descricao: "Plantão — Clínica Horizonte (em processamento)",
    data: "2026-04-23T00:00:00",
    estado: "PENDENTE",
  },
];

export const plantoesDaClinica: Plantao[] = [
  {
    id: "pla-cli-001",
    clinica: clinicaLogada,
    tipoProfissional: "MEDICO",
    especialidade: "Medicina Geral",
    dataInicio: "2026-04-24T08:00:00",
    dataFim: "2026-04-24T20:00:00",
    valorKwanzas: 15000,
    vagas: 2,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: equipamentosCompletos,
    descricao: "Urgência básica com consulta externa.",
    candidatos: 3,
  },
  {
    id: "pla-cli-002",
    clinica: clinicaLogada,
    tipoProfissional: "ENFERMEIRO",
    especialidade: "Enfermagem Geral",
    dataInicio: "2026-04-26T20:00:00",
    dataFim: "2026-04-27T08:00:00",
    valorKwanzas: 12000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: { ...equipamentosCompletos, computador: false },
    descricao: "Plantão noturno de enfermagem.",
    candidatos: 1,
  },
];

export const candidatosMock: Medico[] = [
  {
    id: "med-002",
    nome: "Dra. Ana Ferreira Neto",
    tipo: "MEDICO",
    especialidade: "Medicina Geral",
    numeroOrdem: "OA-LDA-2019-0412",
    numeroSinome: "SINOME-LDA-2019-0412",
    provincia: "Luanda",
    foto: "",
    rating: 4.8,
    totalAvaliacoes: 23,
    totalPlantoes: 41,
    verified: true,
    saldoCarteira: 0,
    bio: "Médica geral com 7 anos de experiência.",
  },
  {
    id: "med-003",
    nome: "Enf.ª Maria Costa",
    tipo: "ENFERMEIRO",
    especialidade: "Enfermagem Geral",
    numeroOrdem: "OE-LDA-2020-0188",
    numeroSinome: "SINOME-LDA-2020-0188",
    provincia: "Luanda",
    foto: "",
    rating: 4.3,
    totalAvaliacoes: 11,
    totalPlantoes: 18,
    verified: true,
    saldoCarteira: 0,
    bio: "Enfermeira geral, experiência em urgência.",
  },
  {
    id: "med-004",
    nome: "Dra. Luísa Mbinda",
    tipo: "MEDICO",
    especialidade: "Medicina Geral",
    numeroOrdem: "OA-LDA-2021-0305",
    numeroSinome: "SINOME-LDA-2021-0305",
    provincia: "Luanda",
    foto: "",
    rating: 4.6,
    totalAvaliacoes: 8,
    totalPlantoes: 12,
    verified: true,
    saldoCarteira: 0,
    bio: "Médica geral recém-formada com boa avaliação.",
  },
];

// Utilitários
export function formatAOA(valor: number): string {
  return new Intl.NumberFormat("pt-AO").format(valor) + " AOA";
}

export function formatData(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("pt-AO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatHora(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

export function calcularDuracao(inicio: string, fim: string): string {
  const diff = Math.abs((new Date(fim).getTime() - new Date(inicio).getTime()) / 3600000);
  return `${diff % 1 === 0 ? diff : diff.toFixed(1)}h`;
}

// --- ADMIN TYPES ---

export type EstadoVerificacao = "APROVADO" | "PENDENTE" | "REJEITADO" | "SUSPENSO";
export type TipoVerificacao = "NORMAL" | "EXPRESS";

export interface AdminMedico extends Medico {
  estadoVerificacao: EstadoVerificacao;
  tipoVerificacao?: TipoVerificacao;
  email: string;
  criadoEm: string;
}

export interface AdminClinica extends Clinica {
  estadoVerificacao: EstadoVerificacao;
  email: string;
  nif: string;
  criadoEm: string;
}

// --- ADMIN MOCK DATA ---

export const adminMedicosMock: AdminMedico[] = [
  { ...medicoLogado, estadoVerificacao: "APROVADO", email: "joao.silva@medfreela.ao", criadoEm: "2026-01-15T10:00:00" },
  { ...candidatosMock[0], estadoVerificacao: "APROVADO", email: "ana.ferreira@medfreela.ao", criadoEm: "2026-02-01T09:00:00" },
  { ...candidatosMock[1], estadoVerificacao: "APROVADO", email: "maria.costa@medfreela.ao", criadoEm: "2026-02-10T14:00:00" },
  { ...candidatosMock[2], estadoVerificacao: "APROVADO", email: "luisa.mbinda@medfreela.ao", criadoEm: "2026-03-05T11:00:00" },
  {
    id: "med-005", nome: "Dr. António Sebastião", tipo: "MEDICO" as TipoProfissional, especialidade: "Cardiologia" as Especialidade,
    numeroOrdem: "OA-LDA-2018-0077", numeroSinome: "SINOME-LDA-2018-0077", provincia: "Luanda", foto: "",
    rating: 0, totalAvaliacoes: 0, totalPlantoes: 0, verified: false,
    saldoCarteira: 0, bio: "Cardiologista com 10 anos de experiência.",
    estadoVerificacao: "PENDENTE", tipoVerificacao: "EXPRESS" as TipoVerificacao, email: "antonio.sebastiao@email.com", criadoEm: "2026-04-26T08:00:00",
  },
  {
    id: "med-006", nome: "Enf.ª Sofia Teixeira", tipo: "ENFERMEIRO" as TipoProfissional, especialidade: "Enfermagem de Urgência" as Especialidade,
    numeroOrdem: "OE-LDA-2022-0211", numeroSinome: "SINOME-LDA-2022-0211", provincia: "Luanda", foto: "",
    rating: 0, totalAvaliacoes: 0, totalPlantoes: 0, verified: false,
    saldoCarteira: 0, bio: "Enfermeira de urgência recém-chegada à cidade.",
    estadoVerificacao: "PENDENTE", tipoVerificacao: "NORMAL" as TipoVerificacao, email: "sofia.teixeira@email.com", criadoEm: "2026-04-24T15:30:00",
  },
  {
    id: "med-007", nome: "Dr. Carlos Mendes", tipo: "MEDICO" as TipoProfissional, especialidade: "Medicina Geral" as Especialidade,
    numeroOrdem: "OA-LDA-2020-0099", numeroSinome: "SINOME-LDA-2020-0099", provincia: "Luanda", foto: "",
    rating: 0, totalAvaliacoes: 0, totalPlantoes: 0, verified: false,
    saldoCarteira: 0, bio: "Médico geral.",
    estadoVerificacao: "REJEITADO", tipoVerificacao: "NORMAL" as TipoVerificacao, email: "carlos.mendes@email.com", criadoEm: "2026-04-10T10:00:00",
  },
];

export const adminClinicasMock: AdminClinica[] = [
  { ...clinicasMock[0], estadoVerificacao: "APROVADO", email: "geral@clinicahorizonte.ao", nif: "500123456", criadoEm: "2026-01-10T09:00:00" },
  { ...clinicasMock[1], estadoVerificacao: "APROVADO", email: "geral@clinicasaude.ao",     nif: "500234567", criadoEm: "2026-01-20T11:00:00" },
  { ...clinicasMock[2], estadoVerificacao: "APROVADO", email: "geral@clinicacentral.ao",   nif: "500345678", criadoEm: "2026-02-05T10:00:00" },
  {
    id: "cli-004", nome: "Clínica Nova Vida", morada: "Rua dos Plátanos, Nº 30",
    cidade: "Kilamba", provincia: "Luanda", logo: "",
    rating: 0, totalAvaliacoes: 0, verified: false,
    estadoVerificacao: "PENDENTE", email: "novavida@email.com", nif: "500456789", criadoEm: "2026-04-19T14:00:00",
  },
  {
    id: "cli-005", nome: "Policlínica Bem-Estar", morada: "Av. Talatona, Nº 5",
    cidade: "Talatona", provincia: "Luanda", logo: "",
    rating: 0, totalAvaliacoes: 0, verified: false,
    estadoVerificacao: "PENDENTE", email: "bemestar@email.com", nif: "500567890", criadoEm: "2026-04-21T09:30:00",
  },
];

export const allTransacoesMock = [
  ...transacoesMock,
  { id: "tx-006", tipo: "CREDITO" as const, valorCentavos: 1800000n, descricao: "Plantão Pediatria — Clínica Central",          data: "2026-04-08T20:00:00", estado: "PROCESSADO" as const },
  { id: "tx-007", tipo: "CREDITO" as const, valorCentavos: 2000000n, descricao: "Plantão noturno — Clínica Horizonte",          data: "2026-04-05T08:00:00", estado: "PROCESSADO" as const },
  { id: "tx-008", tipo: "CREDITO" as const, valorCentavos: 1500000n, descricao: "Plantão — Clínica Saúde+",                     data: "2026-04-01T20:00:00", estado: "PROCESSADO" as const },
  { id: "tx-009", tipo: "DEBITO"  as const, valorCentavos: 2500000n, descricao: "Levantamento — Multicaixa Express",            data: "2026-03-28T11:00:00", estado: "PROCESSADO" as const },
  { id: "tx-010", tipo: "CREDITO" as const, valorCentavos: 1500000n, descricao: "Plantão — Dra. Ana Ferreira / Cl. Horizonte", data: "2026-03-25T20:00:00", estado: "PROCESSADO" as const },
];

export const adminStats = {
  totalMedicos: 7,
  medicosVerificados: 4,
  medicosPendentes: 2,
  medicosRejeitados: 1,
  totalClinicas: 5,
  clinicasVerificadas: 3,
  clinicasPendentes: 2,
  totalPlantoes: 41,
  plantoesAbertos: 4,
  plantoesConcluidos: 28,
  receitaPlataforma: 285000,
  comissaoPlataforma: 28500,
};

// --- SPACE-AS-A-SERVICE ---

export type ZonaLuanda = "Centralidade Horizonte" | "Talatona" | "Miramar" | "Alvalade" | "Kilamba";
export type TipoSala = "CONSULTORIO" | "OBSERVACAO" | "PROCEDIMENTOS";

export interface Sala {
  id: string;
  clinica: Clinica;
  nome: string;
  tipo: TipoSala;
  precoPorHora: number;
  equipamentos: Equipamentos;
  zona: ZonaLuanda;
  descricao: string;
  disponivel: boolean;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
}

export interface ReservaSala {
  id: string;
  sala: Sala;
  dataInicio: string;
  dataFim: string;
  duracaoHoras: number;
  valorTotal: number;
  comissaoPlataforma: number;
  estado: "CONFIRMADA" | "PENDENTE" | "CANCELADA" | "CONCLUIDA";
  codigoReserva: string;
  metodoPagamento: "MULTICAIXA_EXPRESS" | "TRANSFERENCIA_BANCARIA";
  criadoEm: string;
}

export interface AvaliacaoPlantao {
  plantaoId: string;
  nota: number;
  comentario: string;
  tipo: "PROFISSIONAL_AVALIA_CLINICA" | "CLINICA_AVALIA_PROFISSIONAL";
}

const equipamentosCompletos2: Equipamentos = {
  maca: true, estetoscopio: true, tensiometro: true,
  termometro: true, computador: true, materiaisBasicos: true,
  nebulizador: false, oximetro: false, glucometro: false, desfibrilador: false,
};

export const salasMock: Sala[] = [
  {
    id: "sala-001",
    clinica: clinicasMock[0],
    nome: "Consultório A",
    tipo: "CONSULTORIO",
    precoPorHora: 5000,
    equipamentos: equipamentosCompletos2,
    zona: "Centralidade Horizonte",
    descricao: "Consultório completo com maca, computador com acesso ao sistema. Ideal para consultas de clínica geral. Climatizado e com WC privativo.",
    disponivel: true,
    avaliacaoMedia: 4.8,
    totalAvaliacoes: 14,
  },
  {
    id: "sala-002",
    clinica: clinicasMock[0],
    nome: "Consultório B",
    tipo: "CONSULTORIO",
    precoPorHora: 4500,
    equipamentos: { ...equipamentosCompletos2, computador: false },
    zona: "Centralidade Horizonte",
    descricao: "Consultório equipado para consultas gerais. Sem sistema informático integrado — trazer portátil se necessário.",
    disponivel: true,
    avaliacaoMedia: 4.5,
    totalAvaliacoes: 8,
  },
  {
    id: "sala-003",
    clinica: clinicasMock[1],
    nome: "Sala de Observação",
    tipo: "OBSERVACAO",
    precoPorHora: 3500,
    equipamentos: { ...equipamentosCompletos2, nebulizador: true, oximetro: true },
    zona: "Miramar",
    descricao: "Sala de observação com maca articulada e monitorização básica. Adequada para urgências e observação prolongada.",
    disponivel: true,
    avaliacaoMedia: 4.3,
    totalAvaliacoes: 6,
  },
  {
    id: "sala-004",
    clinica: clinicasMock[2],
    nome: "Sala de Procedimentos",
    tipo: "PROCEDIMENTOS",
    precoPorHora: 6000,
    equipamentos: { ...equipamentosCompletos2, desfibrilador: true, oximetro: true, glucometro: true },
    zona: "Talatona",
    descricao: "Sala totalmente equipada para procedimentos menores e consultas especializadas. Desfibrilador disponível.",
    disponivel: true,
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 22,
  },
];

export const minhasReservasMock: ReservaSala[] = [
  {
    id: "res-001",
    sala: salasMock[0],
    dataInicio: "2026-04-26T09:00:00",
    dataFim: "2026-04-26T13:00:00",
    duracaoHoras: 4,
    valorTotal: 20000,
    comissaoPlataforma: 3000,
    estado: "CONFIRMADA",
    codigoReserva: "MF-2026-0042",
    metodoPagamento: "MULTICAIXA_EXPRESS",
    criadoEm: "2026-04-23T10:00:00",
  },
  {
    id: "res-002",
    sala: salasMock[3],
    dataInicio: "2026-04-28T14:00:00",
    dataFim: "2026-04-28T17:00:00",
    duracaoHoras: 3,
    valorTotal: 18000,
    comissaoPlataforma: 2700,
    estado: "CONFIRMADA",
    codigoReserva: "MF-2026-0043",
    metodoPagamento: "TRANSFERENCIA_BANCARIA",
    criadoEm: "2026-04-23T15:30:00",
  },
  {
    id: "res-003",
    sala: salasMock[1],
    dataInicio: "2026-04-20T10:00:00",
    dataFim: "2026-04-20T14:00:00",
    duracaoHoras: 4,
    valorTotal: 18000,
    comissaoPlataforma: 2700,
    estado: "CONCLUIDA",
    codigoReserva: "MF-2026-0038",
    metodoPagamento: "MULTICAIXA_EXPRESS",
    criadoEm: "2026-04-18T09:00:00",
  },
];

export const reservasDaClinicaMock: ReservaSala[] = [
  {
    id: "res-cli-001",
    sala: salasMock[0],
    dataInicio: "2026-04-25T08:00:00",
    dataFim: "2026-04-25T12:00:00",
    duracaoHoras: 4,
    valorTotal: 20000,
    comissaoPlataforma: 3000,
    estado: "CONFIRMADA",
    codigoReserva: "MF-2026-0040",
    metodoPagamento: "MULTICAIXA_EXPRESS",
    criadoEm: "2026-04-22T14:00:00",
  },
  {
    id: "res-cli-002",
    sala: salasMock[1],
    dataInicio: "2026-04-26T14:00:00",
    dataFim: "2026-04-26T17:00:00",
    duracaoHoras: 3,
    valorTotal: 13500,
    comissaoPlataforma: 2025,
    estado: "CONFIRMADA",
    codigoReserva: "MF-2026-0041",
    metodoPagamento: "TRANSFERENCIA_BANCARIA",
    criadoEm: "2026-04-23T09:00:00",
  },
];

