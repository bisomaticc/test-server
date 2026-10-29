const Inquiry = require("../models/inquiry.models");
const transporter = require("../config/mail");

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "https://www.sareesanskriti.com";

function escapeHtml(s) {
  if (s == null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function convertDriveUrl(url) {
  if (!url) return url;
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    const idParam = parsedUrl.searchParams.get("id");
    if (idParam) {
      return `https://lh3.googleusercontent.com/d/${idParam}`;
    }
    return url;
  } catch {
    return url;
  }
}

exports.create = async (data) => {
  const inquiry = await Inquiry.create(data);

  const imgUrl = convertDriveUrl(data.imageUrl);
  const productLink = data.productId
    ? `${CLIENT_ORIGIN}/products/${data.productId}`
    : `${CLIENT_ORIGIN}/products`;

  const cleanPhone = String(data.phone || "").replace(/\D/g, "");
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}` : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:24px;background:#f9fafb;color:#1f2937;">
      <table width="600" align="center" style="background:#fff;border-radius:10px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#800020;padding:20px;text-align:center;border-bottom:3px solid #d4af37;">
            <h2 style="color:#fff;margin:0;">SAREE SANSKRITI</h2>
            <p style="color:#fef3c7;margin:4px 0 0 0;font-size:13px;">New Product Inquiry Received</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h3 style="margin:0 0 16px;color:#111827;">Inquiry for: <a href="${escapeHtml(productLink)}" target="_blank" style="color:#800020;text-decoration:none;">${escapeHtml(data.productName)}</a></h3>
            
            ${
              imgUrl
                ? `<div style="margin-bottom:16px;">
                    <a href="${escapeHtml(productLink)}" target="_blank">
                      <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(data.productName)}" width="140" style="max-width:140px;height:auto;border-radius:6px;border:1px solid #e5e7eb;" />
                    </a>
                   </div>`
                : ""
            }

            <table cellpadding="6" cellspacing="0" style="font-size:14px;width:100%;">
              <tr><td width="100" style="color:#6b7280;font-weight:600;">Customer:</td><td><b>${escapeHtml(data.customerName)}</b></td></tr>
              <tr><td style="color:#6b7280;font-weight:600;">Phone:</td><td><a href="tel:${escapeHtml(data.phone)}" style="color:#800020;font-weight:bold;">${escapeHtml(data.phone)}</a> ${waLink ? `• <a href="${waLink}" style="color:#16a34a;font-weight:bold;text-decoration:none;">Chat on WhatsApp</a>` : ""}</td></tr>
              <tr><td style="color:#6b7280;font-weight:600;">Email:</td><td>${data.email ? `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>` : "-"}</td></tr>
              <tr><td style="color:#6b7280;font-weight:600;vertical-align:top;">Message:</td><td style="line-height:1.4;">${escapeHtml(data.message || "-")}</td></tr>
              <tr><td style="color:#6b7280;font-weight:600;">Product Link:</td><td><a href="${escapeHtml(productLink)}" target="_blank" style="color:#800020;text-decoration:underline;">${escapeHtml(productLink)}</a></td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
New Product Inquiry - Saree Sanskriti
----------------------------------------
Product: ${data.productName}
Product Link: ${productLink}
${imgUrl ? `Photo: ${imgUrl}\n` : ""}
Customer Name: ${data.customerName}
Phone: ${data.phone}
${waLink ? `WhatsApp: ${waLink}\n` : ""}
Email: ${data.email || "-"}
Message: ${data.message || "-"}
----------------------------------------
  `.trim();

  await transporter.sendMail({
    from: `"Saree Sanskriti" <noreply@sareesanskriti.com>`,
    to: "contact@sareesanskriti.com",
    subject: `New Inquiry: ${data.productName} from ${data.customerName}`,
    text,
    html,
  });

  return inquiry;
};
