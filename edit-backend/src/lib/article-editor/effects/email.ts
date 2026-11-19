import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

const FROM_NAME = "Nouse No-Reply";

/**
 * Sends an email over SMTP and records it in emailSent, like PHP sendEmail.
 * Returns true once the message is sent; a failed emailSent insert is only
 * logged so a delivered email is never reported as failed and sent again.
 */
export async function sendEmail(
  to: { email: string; name: string },
  subject: string,
  html: string,
): Promise<boolean> {
  const from = process.env.EMAIL_FROM;
  const host = process.env.EMAIL_HOST;
  if (!from || !host) return false;

  try {
    const transport = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    await transport.sendMail({
      from: { name: FROM_NAME, address: from },
      to: { name: to.name, address: to.email },
      subject,
      html,
    });
  } catch (e) {
    console.error("Email could not be sent", e);
    return false;
  }

  try {
    await prisma.emailSent.create({
      data: {
        users_userid: null,
        emailSent_html: html,
        emailSent_subject: subject,
        emailSent_sent: new Date(),
        emailSent_fromEmail: from,
        emailSent_fromName: FROM_NAME,
        emailSent_toEmail: to.email,
        emailSent_toName: to.name,
      },
    });
  } catch (e) {
    console.error("Sent email could not be logged", e);
  }
  return true;
}
