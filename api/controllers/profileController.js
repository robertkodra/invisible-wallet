const User = require("../models/userModel");

// Get user profile
const getUserProfile = async (req, res) => {
  const _id = req.user._id;
  try {
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(user);
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  const { publicKey, privateKey, account } = req.body;
  const _id = req.user._id;

  try {
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (publicKey && privateKey && account === "argent") {
      user.argent_public_key = publicKey;
      user.argent_private_key = privateKey;
    } else if (publicKey && privateKey && account === "braavos") {
      user.braavos_public_key = publicKey;
      user.braavos_private_key = privateKey;
    }

    await user.save();

    console.log("saved");
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

// Get user's encrypted argent private key
const getArgentPrivateKey = async (req, res) => {
  const { _id } = req.user;

  try {
    const user = await User.findOne({ _id });

    if (!user || !user.argent_private_key) {
      return res.status(404).json({ error: "Private key not found" });
    }

    res.status(200).json({ privateKey: user.argent_private_key });
  } catch (error) {
    console.error("Error in getUserPrivateKey:", error);
    res.status(500).json({ error: "Failed to retrieve private key" });
  }
};

// Get user's encrypted braavos private key
const getBraavosPrivateKey = async (req, res) => {
  const { _id } = req.user;

  try {
    const user = await User.findOne({ _id });

    if (!user || !user.braavos_private_key) {
      return res.status(404).json({ error: "Private key not found" });
    }

    res.status(200).json({ privateKey: user.braavos_private_key });
  } catch (error) {
    console.error("Error in getUserPrivateKey:", error);
    res.status(500).json({ error: "Failed to retrieve private key" });
  }
};
module.exports = {
  getUserProfile,
  updateUserProfile,
  getArgentPrivateKey,
  getBraavosPrivateKey,
};
