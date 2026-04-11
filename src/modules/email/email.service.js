import nodemailer from "nodemailer";
import env from "../../core/config/config.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });
};
