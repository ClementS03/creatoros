import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPurchaseEmail({
  to,
  productName,
  downloadUrl,
}: {
  to: string;
  productName: string;
  downloadUrl: string;
}) {
  await resend.emails.send({
    from: "CreatorOS <hello@creatoroshq.com>",
    to,
    subject: `Your purchase: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Thank you for your purchase!</h1>
        <p style="color: #666; margin-bottom: 24px;">
          Here is your download link for <strong>${productName}</strong>. It expires in 24 hours.
        </p>
        <a href="${downloadUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Download now
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">Powered by CreatorOS</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  await resend.emails.send({
    from: "CreatorOS <hello@creatoroshq.com>",
    to,
    subject: "Welcome to CreatorOS!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px;">Welcome, ${name || "Creator"}!</h1>
        <p style="color: #666;">Your CreatorOS account is ready. Set up your storefront and start selling.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">
          Go to dashboard
        </a>
      </div>
    `,
  });
}
