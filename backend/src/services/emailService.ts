import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!hasSmtpConfig()) return false;
  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "UniNote 密碼重設",
    text: `請在 30 分鐘內開啟以下連結重設密碼：\n${resetUrl}\n\n若不是你提出申請，請忽略這封信。`,
    html: `<p>請在 30 分鐘內開啟以下連結重設密碼：</p><p><a href="${resetUrl}">重設 UniNote 密碼</a></p><p>若不是你提出申請，請忽略這封信。</p>`,
  });
  return true;
}
