const nodemailer = require("nodemailer");
const mailPass =
  process.env.MAIL_PASS ||
  process.env.MAILTRAP_TOKEN ||
  process.env.MAILTRAP_PASSWORD;

var transporter = nodemailer.createTransport({

  host: "live.smtp.mailtrap.io",

  port: 587,

  auth: {

    user: "api",

    pass: mailPass

  }

});

module.exports = transporter;
