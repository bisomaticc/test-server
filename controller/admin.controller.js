const adminService = require("../services/admin.service");

exports.login = async (req, res) => {
  try {
    const token = await adminService.login(req.body);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};