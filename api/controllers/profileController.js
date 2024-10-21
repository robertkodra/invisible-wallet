const User = require("../models/userModel");

// Get user profile
const getUserProfile = async (req, res) => {
  const _id = req.user._id;
  try {
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  console.log("enty here");
  const { publicKey, privateKey } = req.body;
  const _id = req.user._id;

  try {
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (publicKey) {
      user.public_key = publicKey;
    }

    if (privateKey) {
      user.private_key = privateKey;
    }

    await user.save();

    console.log("saved");
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

// Get user's private key
const getUserPrivateKey = async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await User.findOne({ _id });

    if (!user || !user.private_key) {
      return res.status(404).json({ error: "Private key not found" });
    }

    res.status(200).json({ privateKey: user.private_key });
  } catch (error) {
    console.error("Error in getUserPrivateKey:", error);
    res.status(500).json({ error: "Failed to retrieve private key" });
  }
};
module.exports = { getUserProfile, updateUserProfile, getUserPrivateKey };
