// controllers/userController.js
const User = require("../models/userModel");

exports.getProfile = async (req, res) => {
  const { id } = req.params;
  try {
    // Logic to find user by ID in DB
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        // Example stats logic (this could be a separate query)
        stats: { upcoming: 0, registered: 0, total: 0 },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
