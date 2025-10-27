import { Resend } from "resend";
import OTP from "../models/otpModel.js";
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpService = async (email) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  console.log(`[OTP SERVICE] Generated OTP for ${email}: ${otp} (expires at ${expiry})`);

  await OTP.upsert(
    email,
    { otp, expiry }
  );

  const html = `
  <div style="font-family:sans-sarif;">
    <h2>Your OTP is: ${otp}</h2>
    <p>This OTP is valid for 10 minutes.</p>
  </div>
  `;

  await resend.emails.send({
    from: `Dav Creation <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: "Dav Creation OTP",
    html,
  });

  return { success: true, message: "OTP sent successfully" };
};
