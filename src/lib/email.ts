import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM ?? "MedFreela <noreply@medfreela.ao>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://medfreela.ao";

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>MedFreela</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:#0B3C74;padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Med<span style="color:#00A99D;">Freela</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f7f8fa;padding:20px 32px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              MedFreela · Plataforma de Profissionais de Saúde em Angola<br/>
              Se não solicitou este email, pode ignorá-lo com segurança.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
  const transport = createTransport();
  if (!transport) {
    console.warn("[email] SMTP não configurado — email não enviado");
    return false;
  }

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Recuperar Password</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      Recebemos um pedido de recuperação de password para a sua conta MedFreela.<br/>
      Clique no botão abaixo para definir uma nova password. Este link é válido por <strong>30 minutos</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0B3C74;border-radius:10px;padding:14px 28px;">
          <a href="${resetUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
            Redefinir Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Se o botão não funcionar, copie e cole este link no seu browser:</p>
    <p style="margin:0;font-size:12px;color:#0B3C74;word-break:break-all;">${resetUrl}</p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #f0f0f0;"/>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Se não solicitou a recuperação de password, pode ignorar este email — a sua conta está segura.
    </p>
  `);

  try {
    await transport.sendMail({
      from: FROM,
      to: email,
      subject: "Recuperação de Password — MedFreela",
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Falha ao enviar email de recuperação:", err);
    return false;
  }
}

export async function sendCandidaturaAceiteEmail(
  email: string,
  nomeProfissional: string,
  nomeClinica: string,
  dataPlantao: string,
  plantaoUrl: string
): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Candidatura Aceite! 🎉</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Olá <strong>${nomeProfissional}</strong>,<br/><br/>
      A sua candidatura ao plantão na <strong>${nomeClinica}</strong> foi aceite.<br/>
      Data do turno: <strong>${dataPlantao}</strong>
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      Por favor, assine o contrato para confirmar a sua participação.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="background:#00A99D;border-radius:10px;padding:14px 28px;">
          <a href="${plantaoUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
            Ver Contrato
          </a>
        </td>
      </tr>
    </table>
  `);

  try {
    await transport.sendMail({
      from: FROM,
      to: email,
      subject: `Candidatura aceite — ${nomeClinica} · MedFreela`,
      html,
    });
  } catch (err) {
    console.error("[email] Falha ao enviar email candidatura aceite:", err);
  }
}

export async function sendPagamentoConfirmadoEmail(
  email: string,
  nomeProfissional: string,
  valorAoa: number,
  reciboUrl: string
): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const valor = new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(valorAoa);

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Pagamento Confirmado ✅</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;">
      Olá <strong>${nomeProfissional}</strong>,<br/><br/>
      O seu pagamento de <strong style="color:#0B3C74;">${valor}</strong> foi confirmado e creditado na sua carteira MedFreela.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td style="background:#0B3C74;border-radius:10px;padding:14px 28px;">
          <a href="${reciboUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
            Ver Recibo
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Pode solicitar o levantamento do seu saldo a qualquer momento na secção Carteira.
    </p>
  `);

  try {
    await transport.sendMail({
      from: FROM,
      to: email,
      subject: `Pagamento confirmado: ${valor} · MedFreela`,
      html,
    });
  } catch (err) {
    console.error("[email] Falha ao enviar email pagamento:", err);
  }
}

export async function sendVerificacaoAprovadaEmail(
  email: string,
  nome: string,
  dashboardUrl: string
): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">Conta Verificada! ✅</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      Olá <strong>${nome}</strong>,<br/><br/>
      A sua conta MedFreela foi verificada com sucesso. Agora tem acesso completo à plataforma e pode candidatar-se a plantões.
    </p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#00A99D;border-radius:10px;padding:14px 28px;">
          <a href="${dashboardUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
            Aceder ao Dashboard
          </a>
        </td>
      </tr>
    </table>
  `);

  try {
    await transport.sendMail({
      from: FROM,
      to: email,
      subject: "Conta verificada — MedFreela",
      html,
    });
  } catch (err) {
    console.error("[email] Falha ao enviar email verificação:", err);
  }
}

export { BASE_URL };
