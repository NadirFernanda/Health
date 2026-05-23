import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermosServico() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#1a5fba] px-5 pt-10 pb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 text-sm mb-5 hover:text-white transition-colors">
          <ArrowLeft size={14} strokeWidth={2} /> Início
        </Link>
        <h1 className="text-white font-black text-2xl">Termos de Serviço</h1>
        <p className="text-blue-200 text-sm mt-1">Última actualização: Maio de 2025</p>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto pb-16">

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">1. Aceitação dos termos</h2>
          <p className="text-sm text-gray-600 leading-6">
            Ao criar uma conta ou utilizar os serviços da <strong>MedFreela</strong>, declara que leu,
            compreendeu e aceita estes Termos de Serviço. Se não concordar, não deve utilizar a plataforma.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">2. Descrição do serviço</h2>
          <p className="text-sm text-gray-600 leading-6">
            A MedFreela é uma plataforma digital intermediária que:
          </p>
          <ul className="space-y-1 text-sm text-gray-600 leading-6 list-disc pl-4 mt-2">
            <li>Liga profissionais de saúde a clínicas para cobertura de plantões</li>
            <li>Permite a publicação e candidatura a vagas de plantão</li>
            <li>Facilita o aluguer de consultórios e salas clínicas</li>
            <li>Processa pagamentos entre as partes mediante comissão de serviço</li>
          </ul>
          <p className="text-sm text-gray-500 mt-3">
            A MedFreela <strong>não é empregadora</strong> dos profissionais registados e não é responsável
            pela relação laboral entre as partes.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">3. Elegibilidade e registo</h2>
          <ul className="space-y-1.5 text-sm text-gray-600 leading-6 list-disc pl-4">
            <li>Deve ter pelo menos 18 anos para criar uma conta</li>
            <li>Os profissionais de saúde devem possuir habilitação legal para exercer em Angola</li>
            <li>As informações fornecidas no registo devem ser verdadeiras e actualizadas</li>
            <li>Cada pessoa singular ou colectiva pode ter apenas uma conta por categoria</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">4. Verificação de identidade</h2>
          <p className="text-sm text-gray-600 leading-6">
            Para garantir a segurança da plataforma, os profissionais de saúde são sujeitos a um processo de
            verificação de identidade e credenciais. A MedFreela reserva-se o direito de recusar ou suspender
            contas onde as informações não possam ser verificadas.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">5. Comissões e pagamentos</h2>
          <div className="space-y-2 text-sm text-gray-600 leading-6">
            <p>A MedFreela cobra uma <strong>comissão de 10%</strong> sobre o valor de cada plantão publicado por clínicas.</p>
            <p>Os pagamentos são processados através do sistema de escrow da plataforma, sendo libertados ao profissional após confirmação da conclusão do plantão.</p>
            <p>Em caso de disputa, o valor fica retido até resolução, conforme a política de disputas.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">6. Cancelamentos</h2>
          <div className="space-y-2 text-sm text-gray-600 leading-6">
            <p><strong>Cancelamento pelo profissional</strong> com menos de 24h de antecedência: sujeito a penalização conforme gravidade e historial.</p>
            <p><strong>Cancelamento pela clínica</strong> após aceitação: o profissional tem direito a compensação proporcional.</p>
            <p>Cancelamentos recorrentes podem resultar na suspensão da conta.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">7. Conduta na plataforma</h2>
          <p className="text-sm text-gray-600 leading-6 mb-2">É expressamente proibido:</p>
          <ul className="space-y-1 text-sm text-gray-600 leading-6 list-disc pl-4">
            <li>Fornecer informações falsas ou documentos fraudulentos</li>
            <li>Exercer actividade clínica sem habilitação legal válida</li>
            <li>Realizar transacções financeiras fora da plataforma para evitar comissões</li>
            <li>Assediar, ameaçar ou discriminar outros utilizadores</li>
            <li>Utilizar a plataforma para fins ilícitos</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">8. Limitação de responsabilidade</h2>
          <p className="text-sm text-gray-600 leading-6">
            A MedFreela não se responsabiliza por danos directos ou indirectos resultantes de:
            actos médicos praticados pelos profissionais registados; incumprimento de contratos entre
            as partes; falhas de conectividade ou interrupções do serviço fora do nosso controlo.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">9. Propriedade intelectual</h2>
          <p className="text-sm text-gray-600 leading-6">
            Todo o conteúdo da plataforma — logótipo, interface, código, textos — é propriedade da MedFreela
            e está protegido por direitos de autor. É proibida a reprodução sem autorização expressa por escrito.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">10. Resolução de disputas</h2>
          <p className="text-sm text-gray-600 leading-6">
            Em caso de litígio, as partes comprometem-se a tentar resolução amigável no prazo de 15 dias.
            Na ausência de acordo, aplica-se a jurisdição dos tribunais competentes de Luanda, Angola,
            com base na legislação angolana em vigor.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">11. Alterações aos termos</h2>
          <p className="text-sm text-gray-600 leading-6">
            A MedFreela pode alterar estes termos com aviso prévio de 15 dias por e-mail.
            A utilização continuada da plataforma após esse prazo constitui aceitação das alterações.
          </p>
        </div>

        <div className="bg-[#0B3C74]/5 rounded-2xl border border-[#0B3C74]/10 p-4 text-xs text-gray-500 text-center">
          MedFreela · Luanda, Angola · suporte@medfreela.ao
        </div>

        <Link
          href="/legal/privacidade"
          className="block text-center text-sm text-[#0B3C74] font-semibold py-3"
        >
          Ver Política de Privacidade →
        </Link>
      </div>
    </div>
  );
}
