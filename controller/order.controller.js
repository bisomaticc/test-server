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

/** First safe https URL for item thumbnail (string, array, or comma-separated). */
function getItemImageUrls(item) {
  const raw = item.imageUrls;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).map((u) => u.trim()).filter(Boolean);
  }
  const str = String(raw).trim();
  if (!str) return [];
  if (str.includes(",")) {
    return str.split(",").map((u) => u.trim()).filter(Boolean);
  }
  return [str];
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

    await Order.create({
      customerName,
      email,
      phone,
      city,
      address,
      items,
      totalAmount
    });

    const itemsHtml = items
      .map((item) => {
        const line = `${escapeHtml(item.name)} x ${item.qty} - ₹${item.price * item.qty}`;
        const urls = getItemImageUrls(item).filter(isHttpUrl);
        const imgs = urls
          .slice(0, 5)
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
    let waLines = ["New Order", ""];
    waLines.push(`Name: ${customerName}`);
    if (email) waLines.push(`Email: ${email}`);
    waLines.push(`Phone: ${phone}`);
    if (city) waLines.push(`City: ${city}`);
    if (address) waLines.push(`Address: ${address}`);
    waLines.push("", "Items:");
    items.forEach((item) => {
      waLines.push(
        `• ${item.name} x ${item.qty} - ₹${item.price * item.qty}`
      );
      const urls = getItemImageUrls(item).filter(isHttpUrl);
      urls.slice(0, 5).forEach((u) => {
        waLines.push(`  Image: ${u}`);
      });
    });
    waLines.push("");
    waLines.push(`Total: ₹${totalAmount}`);

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
