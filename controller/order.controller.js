const Order = require("../models/order.models");
const Product = require("../models/product.models");
const orderService = require("../services/order.service");
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

function escapeAttr(s) {
  return escapeHtml(s);
}

function escapeRegex(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

/** Clean up item display name to remove duplicate "(Color: ...)" or "(White)" tags */
function cleanItemDisplayName(rawName, color) {
  let name = String(rawName || "").trim();
  if (color) {
    const cTrim = String(color).trim();
    const colorPatt1 = new RegExp(`\\s*\\(Color:\\s*${escapeRegex(cTrim)}\\)`, "gi");
    const colorPatt2 = new RegExp(`\\s*\\(${escapeRegex(cTrim)}\\)`, "gi");
    name = name.replace(colorPatt1, "").replace(colorPatt2, "").trim();
  }
  return name;
}

/** First safe https URL for item thumbnail (string, array, or comma-separated). */
function getItemImageUrls(item) {
  const raw = item.imageUrls || item.imageUrl || item.image;
  if (raw == null) return [];
  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map(String).map((u) => u.trim()).filter(Boolean);
  } else {
    const str = String(raw).trim();
    if (!str) return [];
    if (str.includes(",")) {
      list = str.split(",").map((u) => u.trim()).filter(Boolean);
    } else {
      list = [str];
    }
  }
  return list.map(convertDriveUrl);
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || "").trim());
}

exports.checkout = async (req, res) => {
  try {
    const { customerName, email, phone, city, address, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const totalAmount = items.reduce(
      (acc, item) => acc + item.price * item.qty,
      0
    );

    // Enrich items from MongoDB if image or details are missing
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let urls = getItemImageUrls(item).filter(isHttpUrl);
        let name = item.name;
        let color = item.color || item.selectedColor || "";

        if (item.productId && (!urls.length || !name)) {
          try {
            const dbProduct = await Product.findById(item.productId).lean();
            if (dbProduct) {
              if (!name) name = dbProduct.name;
              if (!urls.length && Array.isArray(dbProduct.imageUrls) && dbProduct.imageUrls.length > 0) {
                urls = dbProduct.imageUrls.map(convertDriveUrl).filter(isHttpUrl);
              }
            }
          } catch {
            // fallback gracefully
          }
        }

        const cleanedName = cleanItemDisplayName(name, color);
        const productUrl =
          item.productUrl ||
          (item.productId ? `${CLIENT_ORIGIN}/products/${item.productId}` : `${CLIENT_ORIGIN}/products`);

        return {
          ...item,
          name: cleanedName,
          color: color,
          productUrl,
          primaryImageUrl: urls[0] || "",
          imageUrls: urls.length > 0 ? urls[0] : (item.imageUrls || ""),
        };
      })
    );

    await Order.create({
      customerName,
      email,
      phone,
      city,
      address,
      items: enrichedItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        imageUrls: i.imageUrls,
        color: i.color,
      })),
      totalAmount,
    });

    // Clean phone number for links
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const customerWaLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}` : "";

    // Build rich HTML email
    const itemsHtmlCards = enrichedItems
      .map((item, index) => {
        const colorLabel = item.color ? `<span style="display:inline-block;background:#f3f4f6;color:#374151;font-size:12px;padding:2px 8px;border-radius:12px;margin-top:4px;">Color: <b>${escapeHtml(item.color)}</b></span>` : "";
        const imgTag = item.primaryImageUrl
          ? `<a href="${escapeAttr(item.productUrl)}" target="_blank" style="text-decoration:none;display:block;">
              <img src="${escapeAttr(item.primaryImageUrl)}" alt="${escapeAttr(item.name)}" width="140" style="width:140px;height:auto;max-height:180px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;display:block;" />
             </a>`
          : `<div style="width:140px;height:140px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;border:1px solid #e5e7eb;">No Image</div>`;

        return `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:16px 12px;vertical-align:top;width:150px;">
              ${imgTag}
            </td>
            <td style="padding:16px 12px;vertical-align:top;">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;margin-bottom:2px;">Item #${index + 1}</div>
              <a href="${escapeAttr(item.productUrl)}" target="_blank" style="color:#800020;font-size:16px;font-weight:bold;text-decoration:none;line-height:1.4;display:inline-block;">
                ${escapeHtml(item.name)}
              </a>
              <div style="margin-top:4px;">${colorLabel}</div>
              <div style="margin-top:8px;font-size:14px;color:#111827;">
                <b>Qty:</b> ${item.qty} &nbsp;|&nbsp; <b>Unit Price:</b> ₹${item.price.toLocaleString("en-IN")} &nbsp;|&nbsp; <b>Subtotal:</b> <span style="color:#800020;font-weight:bold;">₹${(item.price * item.qty).toLocaleString("en-IN")}</span>
              </div>
              <div style="margin-top:10px;">
                <a href="${escapeAttr(item.productUrl)}" target="_blank" style="background:#800020;color:#ffffff;padding:6px 14px;border-radius:4px;font-size:12px;text-decoration:none;font-weight:600;display:inline-block;margin-right:8px;">
                  🛍️ View Product on Website
                </a>
                ${
                  item.primaryImageUrl
                    ? `<a href="${escapeAttr(item.primaryImageUrl)}" target="_blank" style="background:#ffffff;color:#4b5563;border:1px solid #d1d5db;padding:5px 12px;border-radius:4px;font-size:12px;text-decoration:none;display:inline-block;">
                        📷 View Photo
                      </a>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:24px 0;">
          <tr>
            <td align="center">
              <table width="650" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
                <!-- Header -->
                <tr>
                  <td style="background-color:#800020;padding:24px 32px;text-align:center;border-bottom:3px solid #d4af37;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">SAREE SANSKRITI</h1>
                    <p style="margin:6px 0 0 0;color:#fef3c7;font-size:14px;font-weight:500;">✨ New Customer Order Received ✨</p>
                  </td>
                </tr>

                <!-- Customer Details -->
                <tr>
                  <td style="padding:28px 32px 16px 32px;">
                    <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Customer Information</h2>
                    <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;">
                      <tr>
                        <td width="120" style="color:#6b7280;font-weight:600;">Name:</td>
                        <td style="color:#111827;font-weight:bold;">${escapeHtml(customerName)}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-weight:600;">Phone:</td>
                        <td style="color:#111827;">
                          <a href="tel:${escapeAttr(phone)}" style="color:#800020;font-weight:bold;text-decoration:none;">${escapeHtml(phone)}</a>
                          ${
                            customerWaLink
                              ? ` &nbsp;•&nbsp; <a href="${escapeAttr(customerWaLink)}" target="_blank" style="color:#16a34a;font-weight:bold;text-decoration:none;">💬 Chat on WhatsApp</a>`
                              : ""
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-weight:600;">Email:</td>
                        <td>${email ? `<a href="mailto:${escapeAttr(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a>` : "-"}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-weight:600;">City:</td>
                        <td style="color:#111827;">${escapeHtml(city || "-")}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-weight:600;vertical-align:top;">Address:</td>
                        <td style="color:#111827;line-height:1.5;">${escapeHtml(address || "-")}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Ordered Items -->
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <h2 style="margin:16px 0 16px 0;font-size:18px;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px;">Items Ordered</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      ${itemsHtmlCards}
                    </table>
                  </td>
                </tr>

                <!-- Order Total -->
                <tr>
                  <td style="padding:0 32px 32px 32px;">
                    <table width="100%" cellpadding="16" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
                      <tr>
                        <td style="font-size:16px;font-weight:600;color:#991b1b;">Total Order Amount:</td>
                        <td align="right" style="font-size:22px;font-weight:800;color:#800020;">₹${totalAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    </table>

                    ${
                      customerWaLink
                        ? `
                        <div style="margin-top:20px;text-align:center;">
                          <a href="${escapeAttr(customerWaLink)}" target="_blank" style="background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;text-decoration:none;font-weight:bold;display:inline-block;">
                            💬 Open Customer Chat on WhatsApp
                          </a>
                        </div>
                        `
                        : ""
                    }
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">
                    Order received via Saree Sanskriti online catalog • <a href="${escapeAttr(CLIENT_ORIGIN)}" target="_blank" style="color:#800020;text-decoration:none;">Visit Store</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Full Plain Text email with all links & details for mail clients that strip HTML
    const textLines = [
      "========================================",
      "🛍️ NEW ORDER - SAREE SANSKRITI",
      "========================================",
      "",
      "CUSTOMER DETAILS:",
      `• Name: ${customerName}`,
      `• Phone: ${phone}`,
      customerWaLink ? `• WhatsApp Chat: ${customerWaLink}` : null,
      `• Email: ${email || "-"}`,
      `• City: ${city || "-"}`,
      `• Address: ${address || "-"}`,
      "",
      "ITEMS ORDERED:",
      "----------------------------------------",
    ].filter(Boolean);

    enrichedItems.forEach((item, idx) => {
      textLines.push(`${idx + 1}. ${item.name}${item.color ? ` (Color: ${item.color})` : ""}`);
      textLines.push(`   Quantity: ${item.qty}`);
      textLines.push(`   Price: ₹${item.price} each (Subtotal: ₹${item.price * item.qty})`);
      textLines.push(`   Product Link: ${item.productUrl}`);
      if (item.primaryImageUrl) {
        textLines.push(`   Photo: ${item.primaryImageUrl}`);
      }
      textLines.push("");
    });

    textLines.push("----------------------------------------");
    textLines.push(`TOTAL AMOUNT: ₹${totalAmount.toLocaleString("en-IN")}`);
    textLines.push("========================================");

    await transporter.sendMail({
      from: `"Saree Sanskriti" <noreply@sareesanskriti.com>`,
      to: "contact@sareesanskriti.com",
      subject: `New Order from ${customerName} - ₹${totalAmount}`,
      text: textLines.join("\n"),
      html: fullHtml,
    });

    // Format WhatsApp order message with clean standalone links for preview
    const waLines = [
      "*New Saree Order*",
      "",
      "*Customer Details:*",
      `• *Name:* ${customerName}`,
      `• *Phone:* ${phone}`,
    ];
    if (email) waLines.push(`• *Email:* ${email}`);
    if (city) waLines.push(`• *City:* ${city}`);
    if (address) waLines.push(`• *Address:* ${address}`);

    waLines.push("", "*Items Ordered:*");
    enrichedItems.forEach((item) => {
      const colorText = item.color ? ` (Color: ${item.color})` : "";
      waLines.push(`• *${item.name}*${colorText} x ${item.qty} - ₹${item.price * item.qty}`);
      waLines.push(`🔗 Product: ${item.productUrl}`);
      if (item.primaryImageUrl) {
        waLines.push(`📷 Photo: ${item.primaryImageUrl}`);
      }
      waLines.push("");
    });

    waLines.push(`*Total Amount:* ₹${totalAmount.toLocaleString("en-IN")}`);

    const whatsappURL = `https://wa.me/919079707132?text=${encodeURIComponent(
      waLines.join("\n")
    )}`;

    res.json({
      success: true,
      whatsappURL,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const orders = await orderService.getAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
