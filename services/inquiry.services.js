const Inquiry = require("../models/inquiry.models");
const transporter = require("../config/mail");

exports.create = async (data) => {
  const inquiry = await Inquiry.create(data);

  await transporter.sendMail({
    from: `"Saree Sanskriti" <noreply@sareesanskriti.com>`,
    to: "contact@sareesanskriti.com",
    subject: `New Inquiry: ${data.productName}`,
    html: `
      <h3>New Inquiry</h3>
      <p><b>Product:</b> ${data.productName}</p>
      <p><b>Name:</b> ${data.customerName}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Message:</b> ${data.message}</p>
      <p><b>Image:</b> ${data.imageUrl}</p>
    `
  });

  return inquiry;

};

