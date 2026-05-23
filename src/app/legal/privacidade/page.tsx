import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="bg-gradient-to-br from-[#0B3C74] to-[#1a5fba] px-5 pt-10 pb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 text-sm mb-5 hover:text-white transition-colors">
          <ArrowLeft size={14} strokeWidth={2} /> Início
        </Link>
        <h1 className="text-white font-black text-2xl">Política de Privacidade</h1>
        <p className="text-blue-200 text-sm mt-1">Última actualização: Maio de 2025</p>
      </div>

      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto pb-16">

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">1. Quem somos</h2>
          <p className="text-sm text-gray-600 leading-6">
            A <strong>MedFreela</strong> é uma plataforma digital angolana que liga profissionais de saúde a clínicas,
            hospitais e consultórios para gestão de plantões e aluguer de espaços clínicos.
            Operamos ao abrigo das leis da República de Angola, incluindo a Lei n.º 22/11 de 17 de Junho (Lei da Protecção de Dados Pessoais).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">2. Dados que recolhemos</h2>
          <div className="space-y-2 text-sm text-gray-600 leading-6">
            <p><strong>Dados de identificação:</strong> nome completo, número de BI/Passaporte, número de carteira profissional (OMA/SINOME).</p>
            <p><strong>Dados de contacto:</strong> endereço de e-mail, número de telefone.</p>
            <p><strong>Dados profissionais:</strong> especialidade, anos de experiência, documentos de habilitação.</p>
            <p><strong>Dados de utilização:</strong> histórico de plantões, avaliações recebidas, actividade na plataforma.</p>
            <p><strong>Dados financeiros:</strong> informações de pagamento para processamento de transacções (não armazenamos dados de cartão completos).</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">3. Como usamos os seus dados</h2>
          <ul className="space-y-1.5 text-sm text-gray-600 leading-6 list-disc pl-4">
            <li>Verificação de identidade e credenciais profissionais</li>
            <li>Correspondência entre profissionais de saúde e entidades empregadoras</li>
            <li>Processamento de pagamentos e emissão de comprovativos</li>
            <li>Envio de notificações sobre candidaturas e plantões</li>
            <li>Melhoria dos nossos serviços e detecção de fraude</li>
            <li>Cumprimento de obrigações legais e regulatórias</li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">4. Partilha de dados</h2>
          <div className="space-y-2 text-sm text-gray-600 leading-6">
            <p>Os seus dados <strong>não são vendidos</strong> a terceiros. Partilhamos informações apenas nas seguintes circunstâncias:</p>
            <ul className="space-y-1 list-disc pl-4">
              <li>Com clínicas ou médicos para fins de contratação de plantões (apenas dados relevantes para a candidatura)</li>
              <li>Com prestadores de serviços de pagamento para processar transacções</li>
              <li>Com autoridades competentes, quando exigido por lei</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">5. Segurança</h2>
          <p className="text-sm text-gray-600 leading-6">
            Utilizamos encriptação TLS para todas as comunicações, armazenamento seguro de palavras-passe com bcrypt,
            e autenticação baseada em tokens assinados. Os servidores estão localizados em Angola ou em regiões com
            adequadas garantias de protecção de dados.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">6. Os seus direitos</h2>
          <ul className="space-y-1.5 text-sm text-gray-600 leading-6 list-disc pl-4">
            <li><strong>Acesso:</strong> solicitar uma cópia dos seus dados pessoais</li>
            <li><strong>Rectificação:</strong> corrigir dados incorrectos ou incompletos</li>
            <li><strong>Apagamento:</strong> solicitar a eliminação da sua conta e dados</li>
            <li><strong>Portabilidade:</strong> receber os seus dados num formato legível</li>
            <li><strong>Oposição:</strong> opor-se ao tratamento dos seus dados para determinadas finalidades</li>
          </ul>
          <p className="text-sm text-gray-500 mt-3">
            Para exercer estes direitos, contacte-nos em <span className="text-[#0B3C74] font-medium">privacidade@medfreela.ao</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">7. Cookies e dados de sessão</h2>
          <p className="text-sm text-gray-600 leading-6">
            Utilizamos cookies de sessão estritamente necessários para manter a sua autenticação segura.
            Não utilizamos cookies de rastreamento publicitário ou de terceiros.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">8. Retenção de dados</h2>
          <p className="text-sm text-gray-600 leading-6">
            Os dados são retidos enquanto a sua conta estiver activa. Após o pedido de eliminação,
            os dados pessoais são removidos no prazo de 30 dias, excepto onde a retenção seja exigida por lei
            (por exemplo, registos financeiros retidos por 5 anos conforme legislação fiscal angolana).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-[#0B3C74] text-sm mb-3">9. Alterações a esta política</h2>
          <p className="text-sm text-gray-600 leading-6">
            Podemos actualizar esta política periodicamente. Notificaremos os utilizadores por e-mail
            e na plataforma caso ocorram alterações significativas.
          </p>
        </div>

        <div className="bg-[#0B3C74]/5 rounded-2xl border border-[#0B3C74]/10 p-4 text-xs text-gray-500 text-center">
          MedFreela · Luanda, Angola · privacidade@medfreela.ao
        </div>

        <Link
          href="/legal/termos"
          className="block text-center text-sm text-[#0B3C74] font-semibold py-3"
        >
          Ver Termos de Serviço →
        </Link>
      </div>
    </div>
  );
}
