const inquiryService = require("../services/inquiry.services");

exports.create = async (req, res) => {
  try {
    const inquiry = await inquiryService.create(req.body);
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};