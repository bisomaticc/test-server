const nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({

  host: "live.smtp.mailtrap.io",

  port: 587,

  auth: {

    user: "api",

    pass: process.env.MAIL_PASS

  }

});

module.exports = transporter;
