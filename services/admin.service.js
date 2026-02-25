const Admin = require("../models/admin.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw Error("Invalid credentials");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) throw Error("Invalid credentials");

  return jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};