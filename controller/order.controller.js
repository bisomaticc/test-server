const Order = require("../models/order.models");
const orderService = require("../services/order.service");
const transporter = require("../config/mail");

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

/** First safe https URL for item thumbnail (string, array, or comma-separated). */
function getItemImageUrls(item) {
  const raw = item.imageUrls;
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

    // Normalize item image URLs before storing
    const normalizedItems = items.map((item) => {
      const urls = getItemImageUrls(item);
      return {
        ...item,
        imageUrls: urls.length > 0 ? urls[0] : (item.imageUrls || "")
      };
    });

    await Order.create({
      customerName,
      email,
      phone,
      city,
      address,
      items: normalizedItems,
      totalAmount
    });

    const itemsHtml = items
      .map((item) => {
        const colorLabel = item.color ? ` (Color: <b>${escapeHtml(item.color)}</b>)` : "";
        const line = `${escapeHtml(item.name)}${colorLabel} x ${item.qty} - ₹${item.price * item.qty}`;
        const urls = getItemImageUrls(item).filter(isHttpUrl);
        const imgs = urls
          .slice(0, 3)
          .map(
            (u) =>
              `<img src="${escapeAttr(u)}" alt="" width="200" style="max-width:200px;height:auto;display:block;border-radius:6px;margin:8px 0 0 0;border:1px solid #eee;" />`
          )
          .join("");
        const imgBlock = imgs ? `<div style="margin-top:6px;">${imgs}</div>` : "";
        return `<li style="margin-bottom:16px;">${line}${imgBlock}</li>`;
      })
      .join("");

    await transporter.sendMail({
      from: `"Saree Sanskriti" <noreply@sareesanskriti.com>`,
      to: "contact@sareesanskriti.com",
      subject: `New Order from ${customerName}`,
      html: `
        <h3>New Order</h3>
        <p><b>Name:</b> ${escapeHtml(customerName)}</p>
        <p><b>Email:</b> ${escapeHtml(email || "-")}</p>
        <p><b>Phone:</b> ${escapeHtml(phone)}</p>
        <p><b>City:</b> ${escapeHtml(city || "-")}</p>
        <p><b>Address:</b> ${escapeHtml(address || "-")}</p>
        <h4>Items</h4>
        <ul style="padding-left:20px;">${itemsHtml}</ul>
        <p><b>Total:</b> ₹${totalAmount}</p>
      `
    });

    // WhatsApp: plain text + image URL(s) per line (tap to open; WA does not embed images in prefilled text)
    let waLines = ["*New Saree Order*", ""];
    waLines.push(`*Name:* ${customerName}`);
    if (email) waLines.push(`*Email:* ${email}`);
    waLines.push(`*Phone:* ${phone}`);
    if (city) waLines.push(`*City:* ${city}`);
    if (address) waLines.push(`*Address:* ${address}`);
    waLines.push("", "*Items:*");
    items.forEach((item) => {
      const colorText = item.color ? ` (Color: ${item.color})` : "";
      waLines.push(
        `• ${item.name}${colorText} x ${item.qty} - ₹${item.price * item.qty}`
      );
      const urls = getItemImageUrls(item).filter(isHttpUrl);
      urls.slice(0, 2).forEach((u) => {
        waLines.push(`  Photo: ${u}`);
      });
    });
    waLines.push("");
    waLines.push(`*Total:* ₹${totalAmount}`);

    const whatsappURL = `https://wa.me/919079707132?text=${encodeURIComponent(
      waLines.join("\n")
    )}`;

    res.json({
      success: true,
      whatsappURL
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
