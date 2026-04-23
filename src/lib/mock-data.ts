// Dados mockados para demonstração do protótipo

export type Especialidade =
  | "Medicina Geral"
  | "Pediatria"
  | "Ginecologia"
  | "Cardiologia"
  | "Cirurgia"
  | "Ortopedia"
  | "Dermatologia"
  | "Psiquiatria";

export interface Medico {
  id: string;
  nome: string;
  especialidade: Especialidade;
  numeroOrdem: string;
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
  valor: number;
  descricao: string;
  data: string;
  estado: "PROCESSADO" | "PENDENTE";
}

// --- DADOS MOCK ---

export const medicoLogado: Medico = {
  id: "med-001",
  nome: "Dr. João Silva",
  especialidade: "Medicina Geral",
  numeroOrdem: "CDOM-HB-2019-0042",
  provincia: "Huambo",
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
  provincia: "Huambo",
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
    provincia: "Huambo",
    logo: "",
    rating: 4.7,
    totalAvaliacoes: 38,
    verified: true,
  },
  {
    id: "cli-002",
    nome: "Clínica Saúde+",
    morada: "Av. Principal, Nº 45",
    cidade: "Centro",
    provincia: "Huambo",
    logo: "",
    rating: 4.2,
    totalAvaliacoes: 19,
    verified: true,
  },
  {
    id: "cli-003",
    nome: "Clínica Central",
    morada: "Rua dos Médicos, Nº 8",
    cidade: "Centro",
    provincia: "Huambo",
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
    especialidade: "Medicina Geral",
    dataInicio: "2026-04-28T08:00:00",
    dataFim: "2026-04-28T20:00:00",
    valorKwanzas: 15000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: equipamentosCompletos,
    descricao: "Consulta externa geral. Atendimento adultos.",
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
    valor: 15000,
    descricao: "Plantão — Clínica Horizonte",
    data: "2026-04-22T20:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-002",
    tipo: "CREDITO",
    valor: 20000,
    descricao: "Plantão noturno — Clínica Saúde+",
    data: "2026-04-18T08:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-003",
    tipo: "DEBITO",
    valor: 10000,
    descricao: "Levantamento — Multicaixa Express",
    data: "2026-04-15T11:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-004",
    tipo: "CREDITO",
    valor: 15000,
    descricao: "Plantão — Clínica Central",
    data: "2026-04-10T20:00:00",
    estado: "PROCESSADO",
  },
  {
    id: "tx-005",
    tipo: "CREDITO",
    valor: 15000,
    descricao: "Plantão — Clínica Horizonte (em processamento)",
    data: "2026-04-23T00:00:00",
    estado: "PENDENTE",
  },
];

export const plantoesDaClinica: Plantao[] = [
  {
    id: "pla-cli-001",
    clinica: clinicaLogada,
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
    especialidade: "Medicina Geral",
    dataInicio: "2026-04-26T20:00:00",
    dataFim: "2026-04-27T08:00:00",
    valorKwanzas: 20000,
    vagas: 1,
    vagasPreenchidas: 0,
    estado: "ABERTO",
    equipamentos: { ...equipamentosCompletos, computador: false },
    descricao: "Plantão noturno.",
    candidatos: 1,
  },
];

export const candidatosMock: Medico[] = [
  {
    id: "med-002",
    nome: "Dra. Ana Ferreira Neto",
    especialidade: "Medicina Geral",
    numeroOrdem: "CDOM-HB-2019-0412",
    provincia: "Huambo",
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
    nome: "Dr. Manuel Costa",
    especialidade: "Medicina Geral",
    numeroOrdem: "CDOM-HB-2020-0188",
    provincia: "Huambo",
    foto: "",
    rating: 4.3,
    totalAvaliacoes: 11,
    totalPlantoes: 18,
    verified: true,
    saldoCarteira: 0,
    bio: "Médico geral, experiência em urgência.",
  },
  {
    id: "med-004",
    nome: "Dra. Luísa Mbinda",
    especialidade: "Medicina Geral",
    numeroOrdem: "CDOM-HB-2021-0305",
    provincia: "Huambo",
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
