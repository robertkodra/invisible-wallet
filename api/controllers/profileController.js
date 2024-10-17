const User = require("../models/userModel");

// login user
const getUserProfile = async (req, res) => {
  const { _id } = req.user;
  try {
    user = await User.findOne({ _id });
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  const { publicKey, privateKey } = req.body;
  const { _id } = req.user;
  try {
    console.log(_id);
    user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (publicKey) {
      user.public_key = publicKey;
    }

    if (privateKey) {
      user.private_key = privateKey;
    }
    console.log(user);
    await user.save();
    console.log("User updated successfully.");
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUserPrivateKey = async (req, res) => {
  const { _id } = req.user;
  console.log(_id);
  console.log("ID");
  try {
    user = await User.findOne({ _id });
    const privateKey = user.private_key;
    console.log(privateKey);
    res.status(200).json({ privateKey });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = { getUserProfile, updateUserProfile, getUserPrivateKey };
