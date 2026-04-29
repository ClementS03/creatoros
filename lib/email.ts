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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://creatoroshq.com";
  const displayName = name || "Creator";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to CreatorOS</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">
                Creator<span style="color:#7c3aed;">OS</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 36px;">

              <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#09090b;line-height:1.3;">
                Welcome, ${displayName}! 🎉
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;color:#71717a;line-height:1.6;">
                Your CreatorOS account is ready. Here's how to get started:
              </p>

              <!-- Checklist -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#7c3aed;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#fff;font-weight:700;">1</span>
                        </td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#09090b;">Set up your storefront</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Choose your username and customize your public page.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#7c3aed;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#fff;font-weight:700;">2</span>
                        </td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#09090b;">Connect Stripe</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Link your Stripe account to start receiving payments.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#7c3aed;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#fff;font-weight:700;">3</span>
                        </td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#09090b;">Upload your first product</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Add a digital product — template, ebook, preset, or anything else.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-top:1px;">
                          <span style="display:inline-block;width:20px;height:20px;background-color:#7c3aed;border-radius:50%;text-align:center;line-height:20px;font-size:11px;color:#fff;font-weight:700;">4</span>
                        </td>
                        <td>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#09090b;">Share your link</p>
                          <p style="margin:2px 0 0;font-size:13px;color:#71717a;">Put your storefront URL in your bio and start selling.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <a href="${appUrl}/dashboard"
                 style="display:block;text-align:center;background-color:#7c3aed;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:8px;">
                Go to my dashboard →
              </a>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                CreatorOS · Sell your digital products, your way.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "CreatorOS <hello@creatoroshq.com>",
    to,
    subject: `Welcome to CreatorOS, ${displayName}!`,
    html,
  });
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\{\{${key}\}\}`, "g"), val),
    template
  );
}

export function wrapEmailBody(body: string, fromName: string): string {
  const lines = body
    .split("\n")
    .map(line => `<p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">${line}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:18px;font-weight:700;color:#09090b;">${fromName}</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 36px;">
          ${lines}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Powered by CreatorOS</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendLeadMagnetEmail({
  to,
  name,
  productName,
  downloadUrl,
  welcomeEmail,
  fromName,
  fromEmail,
  replyTo,
  unsubscribeUrl,
}: {
  to: string;
  name: string;
  productName: string;
  downloadUrl: string;
  welcomeEmail: { subject: string; body: string } | null;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  unsubscribeUrl: string;
}) {
  const subject = welcomeEmail?.subject?.trim()
    ? interpolate(welcomeEmail.subject, { name })
    : `Here's your free ${productName}!`;

  let rawBody = welcomeEmail?.body?.trim()
    ? welcomeEmail.body
    : `Hi {{name}},\n\nHere's your download link: {{download_link}}\n\nEnjoy!`;

  rawBody = interpolate(rawBody, {
    name,
    download_link: `<a href="${downloadUrl}" style="color:#7c3aed;font-weight:600;">Download now →</a>`,
  });

  if (!rawBody.includes(downloadUrl)) {
    rawBody += `\n\n<a href="${downloadUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Download now →</a>`;
  }

  rawBody += `\n\n<a href="${unsubscribeUrl}" style="font-size:11px;color:#a1a1aa;">Unsubscribe</a>`;

  await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to,
    replyTo,
    subject,
    html: wrapEmailBody(rawBody, fromName),
  });
}

export async function sendBroadcastEmail({
  recipients,
  subject,
  body,
  fromName,
  fromEmail,
  replyTo,
  appUrl,
}: {
  recipients: { email: string; name: string | null; unsubscribeToken: string }[];
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  appUrl: string;
}) {
  const emails = recipients.map(r => {
    const personalizedBody =
      interpolate(body, { name: r.name ?? r.email }) +
      `\n\n<a href="${appUrl}/unsubscribe?token=${r.unsubscribeToken}" style="font-size:11px;color:#a1a1aa;">Unsubscribe</a>`;
    return {
      from: `${fromName} <${fromEmail}>`,
      to: r.email,
      replyTo,
      subject,
      html: wrapEmailBody(personalizedBody, fromName),
    };
  });

  const chunks: (typeof emails)[] = [];
  for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100));
  for (const chunk of chunks) {
    await resend.batch.send(chunk);
  }
}
