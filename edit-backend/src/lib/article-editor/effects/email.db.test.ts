import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { sendEmail } from "./email";

const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

beforeEach(() => {
  vi.stubEnv("EMAIL_HOST", "smtp.example.com");
  vi.stubEnv("EMAIL_USERNAME", "user");
  vi.stubEnv("EMAIL_PASSWORD", "pass");
  vi.stubEnv("EMAIL_FROM", "noreply@nouse.co.uk");
  sendMail.mockReset();
  vi.mocked(nodemailer.createTransport).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const to = { email: "su@example.com", name: "York SU" };

describe("sendEmail", () => {
  it("sends over STARTTLS on 587 and logs the email", async () => {
    sendMail.mockResolvedValue({});
    expect(await sendEmail(to, "Subject", "<b>Hi</b>")).toBe(true);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: "user", pass: "pass" },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: "Nouse No-Reply", address: "noreply@nouse.co.uk" },
      to: { name: "York SU", address: "su@example.com" },
      subject: "Subject",
      html: "<b>Hi</b>",
    });
    const rows = await prisma.emailSent.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      users_userid: null,
      emailSent_html: "<b>Hi</b>",
      emailSent_subject: "Subject",
      emailSent_fromEmail: "noreply@nouse.co.uk",
      emailSent_fromName: "Nouse No-Reply",
      emailSent_toEmail: "su@example.com",
      emailSent_toName: "York SU",
    });
  });

  it("returns false and logs nothing when sending fails", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendEmail(to, "Subject", "x")).toBe(false);
    expect(await prisma.emailSent.count()).toBe(0);
    error.mockRestore();
  });

  it("returns false when email isn't configured", async () => {
    vi.stubEnv("EMAIL_HOST", "");
    expect(await sendEmail(to, "Subject", "x")).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
