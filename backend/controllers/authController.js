const User = require("../models/userModel");

// Logic for Registration
exports.signup = async (req, res) => {
  const { name, email, password, user_type, phone } = req.body;
  try {
    const newUser = await User.create(name, email, password, user_type, phone);
    res.status(201).json({
      success: true,
      message: "Registered successfully",
      user: newUser,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ success: false, error: "Email already registered." });
    }
    res
      .status(500)
      .json({ success: false, error: "Server error during registration" });
  }
};

// Logic for Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Server error during login" });
  }
};
