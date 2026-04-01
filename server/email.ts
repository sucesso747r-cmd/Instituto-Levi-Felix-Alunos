import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Instituto Levi Felix <noreply@institutolevifelix.com.br>";

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function sendWelcomeEmail(
  to: string,
  studentName: string,
  password: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Bem-vindo ao Instituto Levi Felix",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #b91c1c; font-size: 24px; margin-bottom: 16px;">Bem-vindo, ${studentName}!</h1>
          <p style="font-size: 15px; line-height: 1.6;">Sua conta no Instituto Levi Felix foi criada com sucesso. Abaixo estão suas credenciais de acesso:</p>
          <div style="background: #f5f5f5; border-left: 4px solid #b91c1c; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>E-mail:</strong> ${to}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Senha temporária:</strong> ${password}</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6;">Para acessar o sistema, use o link abaixo. Caso precise trocar sua senha, clique em "Esqueceu a senha?" na tela de login.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Atenciosamente,<br/>Instituto Levi Felix</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendWelcomeEmail failed:", err);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  studentName: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Sua senha foi redefinida — Instituto Levi Felix",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #b91c1c; font-size: 24px; margin-bottom: 16px;">Redefinição de senha</h1>
          <p style="font-size: 15px; line-height: 1.6;">Olá, <strong>${studentName}</strong>.</p>
          <p style="font-size: 15px; line-height: 1.6;">Sua senha foi redefinida pelo administrador. Sua nova senha temporária é:</p>
          <div style="background: #f5f5f5; border-left: 4px solid #b91c1c; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 16px; font-family: monospace; letter-spacing: 1px;"><strong>A123456b!</strong></p>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #b91c1c; font-weight: bold;">Troque sua senha para uma mais segura, clique em "Esqueceu a senha?" na tela de login.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Atenciosamente,<br/>Instituto Levi Felix</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendPasswordResetEmail failed:", err);
  }
}

export async function sendRegistrationConfirmedEmail(
  to: string,
  studentName: string,
  examDate: Date | string,
  pixKey: string,
  examPrice: number,
  targetBelt: string
): Promise<void> {
  try {
    const formattedDate = formatDate(examDate);
    const formattedPrice = examPrice.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    await resend.emails.send({
      from: FROM,
      to,
      subject: "Inscrição no Exame de Faixa confirmada!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #b91c1c; font-size: 24px; margin-bottom: 16px;">Inscrição confirmada!</h1>
          <p style="font-size: 15px; line-height: 1.6;">Parabéns, <strong>${studentName}</strong>! Sua inscrição no Exame de Faixa foi solicitada. Confira os detalhes abaixo:</p>
          <div style="background: #f5f5f5; border-left: 4px solid #b91c1c; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Data do exame:</strong> ${formattedDate}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Faixa pretendida:</strong> ${targetBelt}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Valor:</strong> ${formattedPrice}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Chave PIX:</strong> ${pixKey}</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6;">Após realizar o pagamento via PIX, envie o comprovante para o nosso WhatsApp:</p>
          <p style="font-size: 16px; font-weight: bold; color: #b91c1c; margin: 8px 0 24px 0;">(19) 99809-8584</p>
          <p style="font-size: 15px; line-height: 1.6;">Estamos aguardando seu pagamento para confirmar a sua participação no exame!</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Atenciosamente,<br/>Instituto Levi Felix</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendRegistrationConfirmedEmail failed:", err);
  }
}

export async function sendPaymentConfirmedEmail(
  to: string,
  studentName: string,
  examDate: Date | string,
  targetBelt: string
): Promise<void> {
  try {
    const formattedDate = formatDate(examDate);

    await resend.emails.send({
      from: FROM,
      to,
      subject: "Pagamento confirmado — Exame de Faixa",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #b91c1c; font-size: 24px; margin-bottom: 16px;">Pagamento confirmado!</h1>
          <p style="font-size: 15px; line-height: 1.6;">Olá, <strong>${studentName}</strong>! Seu pagamento para o Exame de Faixa foi confirmado com sucesso.</p>
          <div style="background: #f5f5f5; border-left: 4px solid #b91c1c; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Data do exame:</strong> ${formattedDate}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Faixa pretendida:</strong> ${targetBelt}</p>
          </div>
          <p style="font-size: 15px; line-height: 1.6;">Boa sorte no seu exame! Estamos torcendo por você.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Atenciosamente,<br/>Instituto Levi Felix</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendPaymentConfirmedEmail failed:", err);
  }
}

export async function sendAccountDeletedEmail(
  to: string,
  studentName: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Sua conta foi removida — Instituto Levi Felix",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h1 style="color: #b91c1c; font-size: 24px; margin-bottom: 16px;">Conta removida</h1>
          <p style="font-size: 15px; line-height: 1.6;">Olá, <strong>${studentName}</strong>.</p>
          <p style="font-size: 15px; line-height: 1.6;">Informamos que sua conta no Instituto Levi Felix foi removida do sistema.</p>
          <p style="font-size: 15px; line-height: 1.6;">Se você acha que foi excluído por engano, entre em contato com a recepção do Instituto para esclarecimentos.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Atenciosamente,<br/>Instituto Levi Felix</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendAccountDeletedEmail failed:", err);
  }
}
