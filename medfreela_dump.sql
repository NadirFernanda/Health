--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AvaliacaoTipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AvaliacaoTipo" AS ENUM (
    'TURNO',
    'SALA'
);


ALTER TYPE public."AvaliacaoTipo" OWNER TO postgres;

--
-- Name: CredencialEstado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CredencialEstado" AS ENUM (
    'PENDENTE',
    'APROVADO',
    'REJEITADO',
    'EXPRESS_PENDENTE'
);


ALTER TYPE public."CredencialEstado" OWNER TO postgres;

--
-- Name: CredencialTipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CredencialTipo" AS ENUM (
    'BI_PASSAPORTE',
    'CEDULA_OMA',
    'REGISTO_SINOME',
    'DIPLOMA_LICENCIATURA',
    'CERTIFICADO_ESPECIALIZACAO',
    'OUTRO'
);


ALTER TYPE public."CredencialTipo" OWNER TO postgres;

--
-- Name: EstadoCandidatura; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoCandidatura" AS ENUM (
    'PENDENTE',
    'ACEITE',
    'RECUSADO',
    'CANCELADA'
);


ALTER TYPE public."EstadoCandidatura" OWNER TO postgres;

--
-- Name: EstadoDocumento; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoDocumento" AS ENUM (
    'NAO_ENVIADO',
    'PENDENTE',
    'APROVADO',
    'REJEITADO'
);


ALTER TYPE public."EstadoDocumento" OWNER TO postgres;

--
-- Name: EstadoPlantao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoPlantao" AS ENUM (
    'ABERTO',
    'FECHADO',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO'
);


ALTER TYPE public."EstadoPlantao" OWNER TO postgres;

--
-- Name: EstadoReserva; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoReserva" AS ENUM (
    'CONFIRMADA',
    'CANCELADA',
    'CONCLUIDA',
    'PENDENTE_PAGAMENTO',
    'CANCELADA_PROFISSIONAL',
    'CANCELADA_CLINICA'
);


ALTER TYPE public."EstadoReserva" OWNER TO postgres;

--
-- Name: EstadoTransacao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoTransacao" AS ENUM (
    'PENDENTE',
    'PROCESSADO',
    'PROCESSANDO',
    'CONFIRMADO',
    'FALHOU',
    'REEMBOLSADO'
);


ALTER TYPE public."EstadoTransacao" OWNER TO postgres;

--
-- Name: PagamentoEstado; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PagamentoEstado" AS ENUM (
    'PENDENTE',
    'PROCESSANDO',
    'CONFIRMADO',
    'FALHOU',
    'REEMBOLSADO'
);


ALTER TYPE public."PagamentoEstado" OWNER TO postgres;

--
-- Name: PagamentoMetodo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PagamentoMetodo" AS ENUM (
    'MULTICAIXA_EXPRESS',
    'TRANSFERENCIA_BANCARIA',
    'TPA'
);


ALTER TYPE public."PagamentoMetodo" OWNER TO postgres;

--
-- Name: PagamentoTipo; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PagamentoTipo" AS ENUM (
    'TURNO',
    'SALA'
);


ALTER TYPE public."PagamentoTipo" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'MEDICO',
    'CLINICA',
    'PROFISSIONAL',
    'PROPRIETARIO_SALA'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: TipoProfissional; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoProfissional" AS ENUM (
    'MEDICO',
    'ENFERMEIRO',
    'TECNICO_SAUDE',
    'OUTRO'
);


ALTER TYPE public."TipoProfissional" OWNER TO postgres;

--
-- Name: TipoSala; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoSala" AS ENUM (
    'CONSULTORIO',
    'OBSERVACAO',
    'PROCEDIMENTOS',
    'SALA_CURATIVO',
    'OUTRO'
);


ALTER TYPE public."TipoSala" OWNER TO postgres;

--
-- Name: TipoTransacao; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoTransacao" AS ENUM (
    'CREDITO',
    'DEBITO'
);


ALTER TYPE public."TipoTransacao" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Avaliacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Avaliacao" (
    id text NOT NULL,
    "autorId" text,
    "alvoMedicoId" text,
    "alvoClinicaId" text,
    "salaId" text,
    "plantaoId" text,
    estrelas integer NOT NULL,
    comentario text,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "avaliadoRole" text,
    "avaliadoUserId" text,
    "avaliadorUserId" text,
    tipo public."AvaliacaoTipo"
);


ALTER TABLE public."Avaliacao" OWNER TO postgres;

--
-- Name: Candidatura; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Candidatura" (
    id text NOT NULL,
    "plantaoId" text NOT NULL,
    "profissionalId" text NOT NULL,
    estado public."EstadoCandidatura" DEFAULT 'PENDENTE'::public."EstadoCandidatura" NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mensagem text,
    "respondidoEm" timestamp(3) without time zone
);


ALTER TABLE public."Candidatura" OWNER TO postgres;

--
-- Name: Clinica; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Clinica" (
    id text NOT NULL,
    "userId" text NOT NULL,
    nome text NOT NULL,
    morada text,
    cidade text,
    provincia text DEFAULT 'Luanda'::text NOT NULL,
    logo text,
    rating double precision DEFAULT 0 NOT NULL,
    "totalAvaliacoes" integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    alvara text,
    bairro text,
    contacto text,
    descricao text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    "updatedEm" timestamp(3) without time zone NOT NULL,
    website text,
    "zonaLuanda" text,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Clinica" OWNER TO postgres;

--
-- Name: Credencial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Credencial" (
    id text NOT NULL,
    "profissionalId" text NOT NULL,
    tipo public."CredencialTipo" NOT NULL,
    "ficheiroUrl" text,
    "ficheiroNome" text,
    "ficheiroTamanho" integer,
    estado public."CredencialEstado" DEFAULT 'PENDENTE'::public."CredencialEstado" NOT NULL,
    express boolean DEFAULT false NOT NULL,
    comentario text,
    "verificadoPorId" text,
    "verificadoEm" timestamp(3) without time zone,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Credencial" OWNER TO postgres;

--
-- Name: DisponibilidadeSala; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DisponibilidadeSala" (
    id text NOT NULL,
    "salaId" text NOT NULL,
    "diaSemana" integer NOT NULL,
    "horaInicio" text NOT NULL,
    "horaFim" text NOT NULL,
    disponivel boolean DEFAULT true NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DisponibilidadeSala" OWNER TO postgres;

--
-- Name: Documento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Documento" (
    id text NOT NULL,
    "profissionalId" text NOT NULL,
    tipo text NOT NULL,
    ficheiro text,
    estado public."EstadoDocumento" DEFAULT 'NAO_ENVIADO'::public."EstadoDocumento" NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Documento" OWNER TO postgres;

--
-- Name: Notificacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notificacao" (
    id text NOT NULL,
    "userId" text NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    corpo text NOT NULL,
    href text,
    lida boolean DEFAULT false NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notificacao" OWNER TO postgres;

--
-- Name: Pagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Pagamento" (
    id text NOT NULL,
    tipo public."PagamentoTipo" NOT NULL,
    "plantaoId" text,
    "candidaturaId" text,
    "reservaSalaId" text,
    "valorBrutoAoa" integer NOT NULL,
    "comissaoAoa" integer NOT NULL,
    "valorLiquidoAoa" integer NOT NULL,
    metodo public."PagamentoMetodo" NOT NULL,
    estado public."PagamentoEstado" DEFAULT 'PENDENTE'::public."PagamentoEstado" NOT NULL,
    "referenciaExt" text,
    "webhookPayload" jsonb,
    "pagoEm" timestamp(3) without time zone,
    "liberadoEm" timestamp(3) without time zone,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL,
    "beneficiarioProfissionalId" text
);


ALTER TABLE public."Pagamento" OWNER TO postgres;

--
-- Name: Plantao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Plantao" (
    id text NOT NULL,
    "clinicaId" text,
    especialidade text NOT NULL,
    "dataInicio" timestamp(3) without time zone NOT NULL,
    "dataFim" timestamp(3) without time zone NOT NULL,
    "valorKwanzas" integer NOT NULL,
    vagas integer NOT NULL,
    "vagasPreenchidas" integer DEFAULT 0 NOT NULL,
    estado public."EstadoPlantao" DEFAULT 'ABERTO'::public."EstadoPlantao" NOT NULL,
    descricao text,
    maca boolean DEFAULT false NOT NULL,
    estetoscopio boolean DEFAULT false NOT NULL,
    tensiometro boolean DEFAULT false NOT NULL,
    termometro boolean DEFAULT false NOT NULL,
    computador boolean DEFAULT false NOT NULL,
    "materiaisBasicos" boolean DEFAULT true NOT NULL,
    nebulizador boolean DEFAULT false NOT NULL,
    oximetro boolean DEFAULT false NOT NULL,
    glucometro boolean DEFAULT false NOT NULL,
    desfibrilador boolean DEFAULT false NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL,
    "valorCentavos" bigint,
    "salaId" text,
    "tipoProfissional" public."TipoProfissional" DEFAULT 'MEDICO'::public."TipoProfissional" NOT NULL,
    "profissionalPublicadorId" text,
    "publicadoPorMedico" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Plantao" OWNER TO postgres;

--
-- Name: Profissional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Profissional" (
    id text NOT NULL,
    "userId" text NOT NULL,
    nome text NOT NULL,
    tipo public."TipoProfissional" DEFAULT 'MEDICO'::public."TipoProfissional" NOT NULL,
    especialidade text NOT NULL,
    "numeroOrdem" text,
    "numeroSinome" text,
    provincia text DEFAULT 'Luanda'::text NOT NULL,
    foto text,
    bio text,
    rating double precision DEFAULT 0 NOT NULL,
    "totalAvaliacoes" integer DEFAULT 0 NOT NULL,
    "totalPlantoes" integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "saldoCarteira" integer DEFAULT 0 NOT NULL,
    "disponivelAgora" boolean DEFAULT false NOT NULL,
    "anosExperiencia" integer,
    bairro text,
    cidade text,
    "numeroOma" text,
    "saldoCarteiraCentavos" bigint DEFAULT 0 NOT NULL,
    "subEspecialidade" text,
    "verificadoEm" timestamp(3) without time zone
);


ALTER TABLE public."Profissional" OWNER TO postgres;

--
-- Name: ReservaSala; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReservaSala" (
    id text NOT NULL,
    "salaId" text NOT NULL,
    "profissionalId" text NOT NULL,
    data timestamp(3) without time zone NOT NULL,
    "horaInicio" text NOT NULL,
    "duracaoHoras" integer NOT NULL,
    "valorTotal" integer NOT NULL,
    estado public."EstadoReserva" DEFAULT 'CONFIRMADA'::public."EstadoReserva" NOT NULL,
    "codigoQr" text NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL,
    "canceladoEm" timestamp(3) without time zone,
    "comissaoAoa" integer,
    "dataFim" timestamp(3) without time zone,
    "motivoCancelamento" text,
    "pagoEm" timestamp(3) without time zone,
    "valorClinicaAoa" integer,
    "valorTotalCentavos" bigint
);


ALTER TABLE public."ReservaSala" OWNER TO postgres;

--
-- Name: Sala; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sala" (
    id text NOT NULL,
    "clinicaId" text NOT NULL,
    nome text NOT NULL,
    tipo public."TipoSala" NOT NULL,
    "precoPorHora" integer NOT NULL,
    zona text NOT NULL,
    descricao text,
    fotos text[] DEFAULT ARRAY[]::text[],
    disponivel boolean DEFAULT true NOT NULL,
    "avaliacaoMedia" double precision DEFAULT 0 NOT NULL,
    "totalAvaliacoes" integer DEFAULT 0 NOT NULL,
    maca boolean DEFAULT false NOT NULL,
    estetoscopio boolean DEFAULT false NOT NULL,
    tensiometro boolean DEFAULT false NOT NULL,
    termometro boolean DEFAULT false NOT NULL,
    computador boolean DEFAULT false NOT NULL,
    "materiaisBasicos" boolean DEFAULT true NOT NULL,
    nebulizador boolean DEFAULT false NOT NULL,
    oximetro boolean DEFAULT false NOT NULL,
    glucometro boolean DEFAULT false NOT NULL,
    desfibrilador boolean DEFAULT false NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    "atualizadoEm" timestamp(3) without time zone NOT NULL,
    numero text,
    "politicaCancel" text,
    "precoPorHoraCentavos" bigint
);


ALTER TABLE public."Sala" OWNER TO postgres;

--
-- Name: TransacaoCarteira; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransacaoCarteira" (
    id text NOT NULL,
    "profissionalId" text NOT NULL,
    tipo public."TipoTransacao" NOT NULL,
    descricao text NOT NULL,
    estado public."EstadoTransacao" DEFAULT 'PROCESSADO'::public."EstadoTransacao" NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "valorCentavos" bigint NOT NULL,
    referencia text
);


ALTER TABLE public."TransacaoCarteira" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" NOT NULL,
    "criadoEm" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    phone text,
    "updatedEm" timestamp(3) without time zone NOT NULL,
    "verifiedAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Avaliacao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Avaliacao" (id, "autorId", "alvoMedicoId", "alvoClinicaId", "salaId", "plantaoId", estrelas, comentario, "criadoEm", "avaliadoRole", "avaliadoUserId", "avaliadorUserId", tipo) FROM stdin;
\.


--
-- Data for Name: Candidatura; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Candidatura" (id, "plantaoId", "profissionalId", estado, "criadoEm", mensagem, "respondidoEm") FROM stdin;
cmodauk57000m1sv0eqbilxma	cmodauk3w000i1sv0o52i90en	cmodaujzl00071sv0cjhwevek	ACEITE	2026-04-24 19:24:28.411	\N	\N
cmodauk5d000n1sv081b5xmph	cmodauk47000j1sv0e8iuuu48	cmodaujzl00071sv0cjhwevek	PENDENTE	2026-04-24 19:24:28.417	\N	\N
cmodauk5h000o1sv073d9soqc	cmodauk4f000k1sv067nplc8z	cmodaujzl00071sv0cjhwevek	RECUSADO	2026-04-24 19:24:28.423	\N	\N
cmodauk5n000p1sv01ck1ycye	cmodauk4k000l1sv0b5xqe7fh	cmodaujzv00081sv0dpxgzaxw	PENDENTE	2026-04-24 19:24:28.427	\N	\N
cmodauk5q000q1sv0488s2p6q	cmodauk4k000l1sv0b5xqe7fh	cmodauk0500091sv0ao8n7kll	PENDENTE	2026-04-24 19:24:28.43	\N	\N
cmoh5v0xa0001pov0vx3wlq01	cmoh5m2pk0000pov0xuuox4hc	cmodaujzl00071sv0cjhwevek	PENDENTE	2026-04-27 12:15:56.783	\N	\N
\.


--
-- Data for Name: Clinica; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Clinica" (id, "userId", nome, morada, cidade, provincia, logo, rating, "totalAvaliacoes", verified, alvara, bairro, contacto, descricao, latitude, longitude, "updatedEm", website, "zonaLuanda", "criadoEm") FROM stdin;
cmodauk21000f1sv0htwj2ar5	cmodaujyf00021sv0zjv7wjqc	Clínica Horizonte	Rua da Saúde, Nº 12	Centralidade Horizonte	Luanda	\N	4.7	38	t	\N	\N	\N	\N	\N	\N	2026-04-24 19:24:28.297	\N	\N	2026-04-26 21:46:49.614
cmodauk25000g1sv00isfta44	cmodaujyj00031sv05jraqesd	Clínica Saúde+	Av. Miramar, Nº 45	Miramar	Luanda	\N	4.2	19	t	\N	\N	\N	\N	\N	\N	2026-04-24 19:24:28.301	\N	\N	2026-04-26 21:46:49.614
cmodauk28000h1sv0ptq6a6yj	cmodaujyp00041sv0eqiq9k1r	Clínica Central	Rua dos Médicos, Nº 8	Talatona	Luanda	\N	4.5	27	t	\N	\N	\N	\N	\N	\N	2026-04-24 19:24:28.304	\N	\N	2026-04-26 21:46:49.614
\.


--
-- Data for Name: Credencial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Credencial" (id, "profissionalId", tipo, "ficheiroUrl", "ficheiroNome", "ficheiroTamanho", estado, express, comentario, "verificadoPorId", "verificadoEm", "criadoEm", "atualizadoEm") FROM stdin;
\.


--
-- Data for Name: DisponibilidadeSala; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DisponibilidadeSala" (id, "salaId", "diaSemana", "horaInicio", "horaFim", disponivel, "criadoEm") FROM stdin;
\.


--
-- Data for Name: Documento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Documento" (id, "profissionalId", tipo, ficheiro, estado, "criadoEm", "atualizadoEm") FROM stdin;
cmodauk1k000a1sv0hh8n0yiu	cmodaujzl00071sv0cjhwevek	Bilhete de Identidade (BI)	\N	APROVADO	2026-04-24 19:24:28.28	2026-04-24 19:24:28.28
cmodauk1l000b1sv0l10tqnxq	cmodaujzl00071sv0cjhwevek	Carta de Membro — Ordem dos Médicos	\N	APROVADO	2026-04-24 19:24:28.28	2026-04-24 19:24:28.28
cmodauk1l000c1sv03fd6neko	cmodaujzl00071sv0cjhwevek	Registo SINOME / Ministério da Saúde	\N	APROVADO	2026-04-24 19:24:28.28	2026-04-24 19:24:28.28
cmodauk1l000d1sv0i7xa8vu1	cmodaujzl00071sv0cjhwevek	Diploma de Medicina	\N	PENDENTE	2026-04-24 19:24:28.28	2026-04-24 19:24:28.28
cmodauk1l000e1sv02r83eend	cmodaujzl00071sv0cjhwevek	Certificado de Especialidade (se aplicável)	\N	NAO_ENVIADO	2026-04-24 19:24:28.28	2026-04-24 19:24:28.28
\.


--
-- Data for Name: Notificacao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notificacao" (id, "userId", tipo, titulo, corpo, href, lida, "criadoEm") FROM stdin;
cmodauk8y00161sv0kbdo96rr	cmodaujy900011sv0vexubf38	CANDIDATURA_ACEITE	Candidatura Aceite! 🎉	A Clínica Horizonte aceitou a sua candidatura para o turno de Medicina Geral dia 26/04.	/medico/plantoes/cmodauk3w000i1sv0o52i90en	f	2026-04-24 08:30:00
cmodauk8y00171sv0lu7xb50x	cmodaujy900011sv0vexubf38	TURNO_AMANHA	Lembrete: Turno Amanhã	Tem um turno marcado para amanhã, 25/04 às 08:00 na Clínica Central.	/medico/plantoes/cmodauk47000j1sv0e8iuuu48	f	2026-04-24 06:00:00
cmodauk8y00181sv0lfzab0ox	cmodaujy900011sv0vexubf38	PAGAMENTO_PROCESSADO	Pagamento Recebido	Foi creditado 15.000 AOA na sua carteira referente ao turno de 20/04.	/medico/ganhos	f	2026-04-22 13:00:00
cmodauk8y00191sv0fem0n5wa	cmodaujy900011sv0vexubf38	RESERVA_CONFIRMADA	Reserva de Sala Confirmada	A sua reserva do Consultório A (Clínica Horizonte) para 26/04 às 09:00 foi confirmada.	/medico/minhas-reservas	t	2026-04-23 09:15:00
cmodauk8y001a1sv0mze7znrp	cmodaujy900011sv0vexubf38	AVALIACAO_RECEBIDA	Nova Avaliação ⭐⭐⭐⭐⭐	A Clínica Horizonte avaliou o seu desempenho com 5 estrelas.	/medico/perfil	t	2026-04-21 15:30:00
cmodauk9a001b1sv0mldi4fvi	cmodaujyf00021sv0zjv7wjqc	CANDIDATURA_RECEBIDA	Nova Candidatura Recebida	Dr. João Silva candidatou-se ao turno de Medicina Geral de 26/04.	/clinica/plantoes/cmodauk4k000l1sv0b5xqe7fh	f	2026-04-24 07:45:00
cmodauk9a001c1sv0b3qjotlp	cmodaujyf00021sv0zjv7wjqc	RESERVA_SALA	Nova Reserva de Sala	O Consultório A foi reservado para 26/04 às 09:00 (4h). Receberá 17.000 AOA.	/clinica/salas/cmodauk6s000w1sv0j3g04x3m	f	2026-04-23 09:15:00
cmodauk9a001d1sv0xycjzeac	cmodaujyf00021sv0zjv7wjqc	PAGAMENTO_PENDENTE	Pagamento Pendente	O turno de 20/04 com Dr.ª Ana Ferreira ainda não foi pago.	/clinica/faturacao	t	2026-04-21 08:00:00
\.


--
-- Data for Name: Pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Pagamento" (id, tipo, "plantaoId", "candidaturaId", "reservaSalaId", "valorBrutoAoa", "comissaoAoa", "valorLiquidoAoa", metodo, estado, "referenciaExt", "webhookPayload", "pagoEm", "liberadoEm", "criadoEm", "atualizadoEm", "beneficiarioProfissionalId") FROM stdin;
\.


--
-- Data for Name: Plantao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Plantao" (id, "clinicaId", especialidade, "dataInicio", "dataFim", "valorKwanzas", vagas, "vagasPreenchidas", estado, descricao, maca, estetoscopio, tensiometro, termometro, computador, "materiaisBasicos", nebulizador, oximetro, glucometro, desfibrilador, "criadoEm", "atualizadoEm", "valorCentavos", "salaId", "tipoProfissional", "profissionalPublicadorId", "publicadoPorMedico") FROM stdin;
cmodauk3w000i1sv0o52i90en	cmodauk21000f1sv0htwj2ar5	Medicina Geral	2026-04-24 07:00:00	2026-04-24 19:00:00	15000	2	0	ABERTO	Urgência básica com consulta externa. Atendimento adultos e crianças. Necessário pontualidade.	t	t	t	t	t	t	f	t	f	f	2026-04-24 19:24:28.364	2026-04-24 19:24:28.364	\N	\N	MEDICO	\N	f
cmodauk47000j1sv0e8iuuu48	cmodauk25000g1sv00isfta44	Medicina Geral	2026-04-26 19:00:00	2026-04-27 07:00:00	20000	1	0	ABERTO	Plantão noturno de urgência. Experiência em medicina de urgência preferencial.	t	t	t	t	f	t	f	f	f	f	2026-04-24 19:24:28.375	2026-04-24 19:24:28.375	\N	\N	MEDICO	\N	f
cmodauk4f000k1sv067nplc8z	cmodauk28000h1sv0ptq6a6yj	Pediatria	2026-04-25 07:00:00	2026-04-25 19:00:00	18000	1	0	ABERTO	Consulta externa pediátrica. Experiência com crianças obrigatória.	t	t	t	t	t	t	t	t	f	f	2026-04-24 19:24:28.383	2026-04-24 19:24:28.383	\N	\N	MEDICO	\N	f
cmodauk4k000l1sv0b5xqe7fh	cmodauk21000f1sv0htwj2ar5	Medicina Geral	2026-04-28 07:00:00	2026-04-28 19:00:00	15000	1	0	ABERTO	Consulta externa geral. Atendimento adultos.	t	t	t	t	t	t	f	t	f	f	2026-04-24 19:24:28.388	2026-04-24 19:24:28.388	\N	\N	MEDICO	\N	f
cmoga14c4000020v0d3u1xq6u	\N	Pediatria	2026-04-26 07:00:00	2026-04-26 19:00:00	30000	1	0	ABERTO	E é um platão muito importante	f	f	f	f	f	t	f	f	f	f	2026-04-26 21:24:53.429	2026-04-26 21:24:53.429	3000000	\N	MEDICO	cmodaujzl00071sv0cjhwevek	t
cmoh5m2pk0000pov0xuuox4hc	\N	Neurologia	2026-04-27 07:00:00	2026-04-28 19:00:00	50000	1	0	ABERTO	Testando	f	f	f	f	f	t	f	f	f	f	2026-04-27 12:08:59.192	2026-04-27 12:08:59.192	5000000	\N	MEDICO	cmodaujzl00071sv0cjhwevek	t
\.


--
-- Data for Name: Profissional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Profissional" (id, "userId", nome, tipo, especialidade, "numeroOrdem", "numeroSinome", provincia, foto, bio, rating, "totalAvaliacoes", "totalPlantoes", verified, "saldoCarteira", "disponivelAgora", "anosExperiencia", bairro, cidade, "numeroOma", "saldoCarteiraCentavos", "subEspecialidade", "verificadoEm") FROM stdin;
cmodaujzl00071sv0cjhwevek	cmodaujy900011sv0vexubf38	Dr. João Silva	MEDICO	Medicina Geral	OA-LDA-2019-0042	SINOME-LDA-2019-0042	Luanda	\N	Médico geral com 7 anos de experiência, especializado em urgência básica e consulta externa.	4.8	23	41	t	45000	f	\N	\N	\N	\N	0	\N	\N
cmodaujzv00081sv0dpxgzaxw	cmodaujyt00051sv07fpd70m0	Dra. Ana Ferreira Neto	MEDICO	Medicina Geral	OA-LDA-2019-0412	SINOME-LDA-2019-0412	Luanda	\N	\N	4.8	23	41	t	0	f	\N	\N	\N	\N	0	\N	\N
cmodauk0500091sv0ao8n7kll	cmodaujyw00061sv0gjdj71un	Enf.ª Maria Costa	ENFERMEIRO	Enfermagem Geral	OE-LDA-2020-0188	SINOME-LDA-2020-0188	Luanda	\N	\N	4.3	11	18	t	0	f	\N	\N	\N	\N	0	\N	\N
\.


--
-- Data for Name: ReservaSala; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReservaSala" (id, "salaId", "profissionalId", data, "horaInicio", "duracaoHoras", "valorTotal", estado, "codigoQr", "criadoEm", "atualizadoEm", "canceladoEm", "comissaoAoa", "dataFim", "motivoCancelamento", "pagoEm", "valorClinicaAoa", "valorTotalCentavos") FROM stdin;
cmodauk8g00101sv0pipekzr4	cmodauk6s000w1sv0j3g04x3m	cmodaujzl00071sv0cjhwevek	2026-04-26 08:00:00	09:00	4	20000	CONFIRMADA	cmodauk8g00111sv004alhrxx	2026-04-24 19:24:28.528	2026-04-24 19:24:28.528	\N	\N	\N	\N	\N	\N	\N
cmodauk8h00121sv0f9tadovy	cmodauk79000x1sv0n91xh5ds	cmodaujzl00071sv0cjhwevek	2026-04-28 13:00:00	14:00	2	9000	CONFIRMADA	cmodauk8h00131sv0d9vx1m2e	2026-04-24 19:24:28.528	2026-04-24 19:24:28.528	\N	\N	\N	\N	\N	\N	\N
cmodauk8h00141sv0bo233e8j	cmodauk7t000y1sv0pxyj98qw	cmodaujzl00071sv0cjhwevek	2026-04-20 09:00:00	10:00	3	10500	CONCLUIDA	cmodauk8h00151sv0hq0aqyr8	2026-04-24 19:24:28.528	2026-04-24 19:24:28.528	\N	\N	\N	\N	\N	\N	\N
cmoh7eu4q0002pov0kcepc0xe	cmodauk83000z1sv0ytqm3pex	cmodaujzl00071sv0cjhwevek	2026-04-27 00:00:00	08:00	8	48000	CONFIRMADA	cmoh7eu4q0003pov0qg24jwif	2026-04-27 12:59:20.715	2026-04-27 12:59:20.715	\N	\N	\N	\N	\N	\N	4800000
\.


--
-- Data for Name: Sala; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sala" (id, "clinicaId", nome, tipo, "precoPorHora", zona, descricao, fotos, disponivel, "avaliacaoMedia", "totalAvaliacoes", maca, estetoscopio, tensiometro, termometro, computador, "materiaisBasicos", nebulizador, oximetro, glucometro, desfibrilador, "criadoEm", ativo, "atualizadoEm", numero, "politicaCancel", "precoPorHoraCentavos") FROM stdin;
cmodauk6s000w1sv0j3g04x3m	cmodauk21000f1sv0htwj2ar5	Consultório A	CONSULTORIO	5000	Centralidade Horizonte	Consultório completo com maca, computador com acesso ao sistema. Ideal para consultas de clínica geral. Climatizado e com WC privativo.	{}	t	4.8	14	t	t	t	t	t	t	f	t	f	f	2026-04-24 19:24:28.468	t	2026-04-24 19:24:28.468	\N	\N	\N
cmodauk79000x1sv0n91xh5ds	cmodauk21000f1sv0htwj2ar5	Consultório B	CONSULTORIO	4500	Centralidade Horizonte	Consultório equipado para consultas gerais. Sem sistema informático integrado.	{}	t	4.5	8	t	t	t	t	f	t	f	t	f	f	2026-04-24 19:24:28.485	t	2026-04-24 19:24:28.485	\N	\N	\N
cmodauk7t000y1sv0pxyj98qw	cmodauk25000g1sv00isfta44	Sala de Observação	OBSERVACAO	3500	Miramar	Sala de observação com maca articulada e monitorização básica.	{}	t	4.3	6	t	t	t	t	t	t	t	t	f	f	2026-04-24 19:24:28.505	t	2026-04-24 19:24:28.505	\N	\N	\N
cmodauk83000z1sv0ytqm3pex	cmodauk28000h1sv0ptq6a6yj	Sala de Procedimentos	PROCEDIMENTOS	6000	Talatona	Sala totalmente equipada para procedimentos menores e consultas especializadas.	{}	t	4.9	22	t	t	t	t	t	t	f	t	t	t	2026-04-24 19:24:28.515	t	2026-04-24 19:24:28.515	\N	\N	\N
\.


--
-- Data for Name: TransacaoCarteira; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransacaoCarteira" (id, "profissionalId", tipo, descricao, estado, "criadoEm", "valorCentavos", referencia) FROM stdin;
cmodauk6e000r1sv0ea9neuc2	cmodaujzl00071sv0cjhwevek	CREDITO	Plantão — Clínica Horizonte	PROCESSADO	2026-04-24 19:24:28.454	1500000	\N
cmodauk6e000s1sv08xsia8ur	cmodaujzl00071sv0cjhwevek	CREDITO	Plantão noturno — Clínica Saúde+	PROCESSADO	2026-04-24 19:24:28.454	2000000	\N
cmodauk6e000t1sv0k7rjipep	cmodaujzl00071sv0cjhwevek	DEBITO	Levantamento — Multicaixa Express	PROCESSADO	2026-04-24 19:24:28.454	1000000	\N
cmodauk6e000u1sv0d10pzugg	cmodaujzl00071sv0cjhwevek	CREDITO	Plantão — Clínica Central	PROCESSADO	2026-04-24 19:24:28.454	1500000	\N
cmodauk6e000v1sv0otef5jq8	cmodaujzl00071sv0cjhwevek	CREDITO	Plantão — Clínica Horizonte (em processamento)	PENDENTE	2026-04-24 19:24:28.454	1500000	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", role, "criadoEm", "isActive", "lastLoginAt", phone, "updatedEm", "verifiedAt") FROM stdin;
cmodaujxj00001sv04e4dyumb	admin@plantoamed.ao	$2b$10$z.d.KBFdBfhapvcn9cwBWectRdEai3BboRnMKK/rmnuQfe59Y2NNG	ADMIN	2026-04-24 19:24:28.135	t	\N	\N	2026-04-24 19:24:28.135	\N
cmodaujy900011sv0vexubf38	medico@plantoamed.ao	$2b$10$1NOsIYaJmSlsXp7ZLohAs.NADJ5pTBGjKxx0A3b725MGIWcGwAiFu	MEDICO	2026-04-24 19:24:28.161	t	\N	\N	2026-04-24 19:24:28.161	\N
cmodaujyf00021sv0zjv7wjqc	clinica@horizonte.ao	$2b$10$IF/JL44Kw.tv6cdbdXdzGuEPfprrZYvxgIoE7FSJBKg7lwmwJzd9.	CLINICA	2026-04-24 19:24:28.167	t	\N	\N	2026-04-24 19:24:28.167	\N
cmodaujyj00031sv05jraqesd	clinica@saudemais.ao	$2b$10$IF/JL44Kw.tv6cdbdXdzGuEPfprrZYvxgIoE7FSJBKg7lwmwJzd9.	CLINICA	2026-04-24 19:24:28.172	t	\N	\N	2026-04-24 19:24:28.172	\N
cmodaujyp00041sv0eqiq9k1r	clinica@central.ao	$2b$10$IF/JL44Kw.tv6cdbdXdzGuEPfprrZYvxgIoE7FSJBKg7lwmwJzd9.	CLINICA	2026-04-24 19:24:28.177	t	\N	\N	2026-04-24 19:24:28.177	\N
cmodaujyt00051sv07fpd70m0	ana.ferreira@medfreela.ao	$2b$10$1NOsIYaJmSlsXp7ZLohAs.NADJ5pTBGjKxx0A3b725MGIWcGwAiFu	MEDICO	2026-04-24 19:24:28.181	t	\N	\N	2026-04-24 19:24:28.181	\N
cmodaujyw00061sv0gjdj71un	maria.costa@medfreela.ao	$2b$10$1NOsIYaJmSlsXp7ZLohAs.NADJ5pTBGjKxx0A3b725MGIWcGwAiFu	MEDICO	2026-04-24 19:24:28.184	t	\N	\N	2026-04-24 19:24:28.184	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9b0dfc62-a21f-4b25-810d-f3bb24e13c5e	9e5b7a69368f1a19f78bd41b242208a7ce6725b12510adf5bd3552eeab3efa0a	2026-04-24 20:29:55.017146+01	20260424_phase1_baseline		\N	2026-04-24 20:29:55.017146+01	0
8b766539-8a63-4d9b-8d17-615a164059f5	d2f4fa3ed5aecc6df3e54d4c09cbc49c611edc863be02782438c305bad596412	2026-04-26 21:46:49.845424+01	20260425_phase2_schema_gaps	\N	\N	2026-04-26 21:46:49.603997+01	1
76a6045a-24f7-4f78-9b96-9f992a203f42	c21459bcf6be1027797cb4817a80e2a8081aa97b4bc1b753c787cb0a6be32398	2026-04-26 22:08:36.645417+01	20260426_phase3_medico_publica_plantao	\N	\N	2026-04-26 22:08:36.599113+01	1
d887d060-14c9-493d-a450-4843c681fbe6	b57bfb79e184ebbb62c96a3ff3cd414a189f158b12ba6cf75b59aabe8a787f9f	2026-04-27 14:13:46.421924+01	20260427131346_add_pagamento_beneficiario	\N	\N	2026-04-27 14:13:46.300627+01	1
\.


--
-- Name: Avaliacao Avaliacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_pkey" PRIMARY KEY (id);


--
-- Name: Candidatura Candidatura_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidatura"
    ADD CONSTRAINT "Candidatura_pkey" PRIMARY KEY (id);


--
-- Name: Clinica Clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clinica"
    ADD CONSTRAINT "Clinica_pkey" PRIMARY KEY (id);


--
-- Name: Credencial Credencial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credencial"
    ADD CONSTRAINT "Credencial_pkey" PRIMARY KEY (id);


--
-- Name: DisponibilidadeSala DisponibilidadeSala_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DisponibilidadeSala"
    ADD CONSTRAINT "DisponibilidadeSala_pkey" PRIMARY KEY (id);


--
-- Name: Documento Documento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_pkey" PRIMARY KEY (id);


--
-- Name: Notificacao Notificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacao"
    ADD CONSTRAINT "Notificacao_pkey" PRIMARY KEY (id);


--
-- Name: Pagamento Pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pagamento"
    ADD CONSTRAINT "Pagamento_pkey" PRIMARY KEY (id);


--
-- Name: Plantao Plantao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plantao"
    ADD CONSTRAINT "Plantao_pkey" PRIMARY KEY (id);


--
-- Name: Profissional Profissional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profissional"
    ADD CONSTRAINT "Profissional_pkey" PRIMARY KEY (id);


--
-- Name: ReservaSala ReservaSala_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReservaSala"
    ADD CONSTRAINT "ReservaSala_pkey" PRIMARY KEY (id);


--
-- Name: Sala Sala_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sala"
    ADD CONSTRAINT "Sala_pkey" PRIMARY KEY (id);


--
-- Name: TransacaoCarteira TransacaoCarteira_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransacaoCarteira"
    ADD CONSTRAINT "TransacaoCarteira_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Avaliacao_alvoClinicaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Avaliacao_alvoClinicaId_idx" ON public."Avaliacao" USING btree ("alvoClinicaId");


--
-- Name: Avaliacao_alvoMedicoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Avaliacao_alvoMedicoId_idx" ON public."Avaliacao" USING btree ("alvoMedicoId");


--
-- Name: Avaliacao_autorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Avaliacao_autorId_idx" ON public."Avaliacao" USING btree ("autorId");


--
-- Name: Avaliacao_plantaoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Avaliacao_plantaoId_idx" ON public."Avaliacao" USING btree ("plantaoId");


--
-- Name: Candidatura_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Candidatura_estado_idx" ON public."Candidatura" USING btree (estado);


--
-- Name: Candidatura_plantaoId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Candidatura_plantaoId_idx" ON public."Candidatura" USING btree ("plantaoId");


--
-- Name: Candidatura_plantaoId_profissionalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Candidatura_plantaoId_profissionalId_key" ON public."Candidatura" USING btree ("plantaoId", "profissionalId");


--
-- Name: Candidatura_profissionalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Candidatura_profissionalId_idx" ON public."Candidatura" USING btree ("profissionalId");


--
-- Name: Clinica_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Clinica_userId_key" ON public."Clinica" USING btree ("userId");


--
-- Name: Clinica_verified_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Clinica_verified_idx" ON public."Clinica" USING btree (verified);


--
-- Name: Clinica_zonaLuanda_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Clinica_zonaLuanda_idx" ON public."Clinica" USING btree ("zonaLuanda");


--
-- Name: Credencial_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credencial_estado_idx" ON public."Credencial" USING btree (estado);


--
-- Name: Credencial_profissionalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Credencial_profissionalId_idx" ON public."Credencial" USING btree ("profissionalId");


--
-- Name: DisponibilidadeSala_salaId_diaSemana_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DisponibilidadeSala_salaId_diaSemana_idx" ON public."DisponibilidadeSala" USING btree ("salaId", "diaSemana");


--
-- Name: Notificacao_lida_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacao_lida_idx" ON public."Notificacao" USING btree (lida);


--
-- Name: Notificacao_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notificacao_userId_idx" ON public."Notificacao" USING btree ("userId");


--
-- Name: Pagamento_beneficiarioProfissionalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pagamento_beneficiarioProfissionalId_idx" ON public."Pagamento" USING btree ("beneficiarioProfissionalId");


--
-- Name: Pagamento_candidaturaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pagamento_candidaturaId_idx" ON public."Pagamento" USING btree ("candidaturaId");


--
-- Name: Pagamento_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pagamento_estado_idx" ON public."Pagamento" USING btree (estado);


--
-- Name: Pagamento_referenciaExt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pagamento_referenciaExt_idx" ON public."Pagamento" USING btree ("referenciaExt");


--
-- Name: Pagamento_reservaSalaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Pagamento_reservaSalaId_idx" ON public."Pagamento" USING btree ("reservaSalaId");


--
-- Name: Plantao_clinicaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plantao_clinicaId_idx" ON public."Plantao" USING btree ("clinicaId");


--
-- Name: Plantao_dataInicio_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plantao_dataInicio_idx" ON public."Plantao" USING btree ("dataInicio");


--
-- Name: Plantao_especialidade_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plantao_especialidade_idx" ON public."Plantao" USING btree (especialidade);


--
-- Name: Plantao_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plantao_estado_idx" ON public."Plantao" USING btree (estado);


--
-- Name: Plantao_tipoProfissional_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Plantao_tipoProfissional_idx" ON public."Plantao" USING btree ("tipoProfissional");


--
-- Name: Profissional_disponivelAgora_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Profissional_disponivelAgora_idx" ON public."Profissional" USING btree ("disponivelAgora");


--
-- Name: Profissional_especialidade_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Profissional_especialidade_idx" ON public."Profissional" USING btree (especialidade);


--
-- Name: Profissional_numeroSinome_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Profissional_numeroSinome_key" ON public."Profissional" USING btree ("numeroSinome") WHERE ("numeroSinome" IS NOT NULL);


--
-- Name: Profissional_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Profissional_tipo_idx" ON public."Profissional" USING btree (tipo);


--
-- Name: Profissional_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Profissional_userId_key" ON public."Profissional" USING btree ("userId");


--
-- Name: Profissional_verified_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Profissional_verified_idx" ON public."Profissional" USING btree (verified);


--
-- Name: ReservaSala_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReservaSala_estado_idx" ON public."ReservaSala" USING btree (estado);


--
-- Name: ReservaSala_profissionalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReservaSala_profissionalId_idx" ON public."ReservaSala" USING btree ("profissionalId");


--
-- Name: ReservaSala_salaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReservaSala_salaId_idx" ON public."ReservaSala" USING btree ("salaId");


--
-- Name: Sala_ativo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sala_ativo_idx" ON public."Sala" USING btree (ativo);


--
-- Name: Sala_clinicaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sala_clinicaId_idx" ON public."Sala" USING btree ("clinicaId");


--
-- Name: Sala_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sala_tipo_idx" ON public."Sala" USING btree (tipo);


--
-- Name: TransacaoCarteira_criadoEm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TransacaoCarteira_criadoEm_idx" ON public."TransacaoCarteira" USING btree ("criadoEm");


--
-- Name: TransacaoCarteira_profissionalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TransacaoCarteira_profissionalId_idx" ON public."TransacaoCarteira" USING btree ("profissionalId");


--
-- Name: TransacaoCarteira_tipo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TransacaoCarteira_tipo_idx" ON public."TransacaoCarteira" USING btree (tipo);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Avaliacao Avaliacao_alvoClinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_alvoClinicaId_fkey" FOREIGN KEY ("alvoClinicaId") REFERENCES public."Clinica"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Avaliacao Avaliacao_alvoMedicoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_alvoMedicoId_fkey" FOREIGN KEY ("alvoMedicoId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Avaliacao Avaliacao_autorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Avaliacao Avaliacao_plantaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES public."Plantao"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Avaliacao Avaliacao_salaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Avaliacao"
    ADD CONSTRAINT "Avaliacao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES public."Sala"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Candidatura Candidatura_plantaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidatura"
    ADD CONSTRAINT "Candidatura_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES public."Plantao"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Candidatura Candidatura_profissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidatura"
    ADD CONSTRAINT "Candidatura_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Clinica Clinica_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clinica"
    ADD CONSTRAINT "Clinica_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Credencial Credencial_profissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credencial"
    ADD CONSTRAINT "Credencial_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Credencial Credencial_verificadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Credencial"
    ADD CONSTRAINT "Credencial_verificadoPorId_fkey" FOREIGN KEY ("verificadoPorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DisponibilidadeSala DisponibilidadeSala_salaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DisponibilidadeSala"
    ADD CONSTRAINT "DisponibilidadeSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES public."Sala"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Documento Documento_profissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documento"
    ADD CONSTRAINT "Documento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notificacao Notificacao_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notificacao"
    ADD CONSTRAINT "Notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Pagamento Pagamento_beneficiarioProfissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pagamento"
    ADD CONSTRAINT "Pagamento_beneficiarioProfissionalId_fkey" FOREIGN KEY ("beneficiarioProfissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pagamento Pagamento_candidaturaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pagamento"
    ADD CONSTRAINT "Pagamento_candidaturaId_fkey" FOREIGN KEY ("candidaturaId") REFERENCES public."Candidatura"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pagamento Pagamento_plantaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pagamento"
    ADD CONSTRAINT "Pagamento_plantaoId_fkey" FOREIGN KEY ("plantaoId") REFERENCES public."Plantao"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pagamento Pagamento_reservaSalaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Pagamento"
    ADD CONSTRAINT "Pagamento_reservaSalaId_fkey" FOREIGN KEY ("reservaSalaId") REFERENCES public."ReservaSala"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Plantao Plantao_clinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plantao"
    ADD CONSTRAINT "Plantao_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES public."Clinica"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Plantao Plantao_profissionalPublicadorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plantao"
    ADD CONSTRAINT "Plantao_profissionalPublicadorId_fkey" FOREIGN KEY ("profissionalPublicadorId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Plantao Plantao_salaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plantao"
    ADD CONSTRAINT "Plantao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES public."Sala"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Profissional Profissional_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Profissional"
    ADD CONSTRAINT "Profissional_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReservaSala ReservaSala_profissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReservaSala"
    ADD CONSTRAINT "ReservaSala_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ReservaSala ReservaSala_salaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReservaSala"
    ADD CONSTRAINT "ReservaSala_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES public."Sala"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sala Sala_clinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sala"
    ADD CONSTRAINT "Sala_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES public."Clinica"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransacaoCarteira TransacaoCarteira_profissionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransacaoCarteira"
    ADD CONSTRAINT "TransacaoCarteira_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES public."Profissional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

