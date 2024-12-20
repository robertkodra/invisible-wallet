const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },

    argent_public_key: {
      type: String,
      required: false,
      trim: true,
    },
    argent_private_key: {
      type: String,
      required: false,
      trim: true,
    },

    braavos_public_key: {
      type: String,
      required: false,
      trim: true,
    },
    braavos_private_key: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static Signup Method
userSchema.statics.signup = async function (email, password) {
  if (!email || !password) {
    throw Error("All field must be filled.");
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid.");
  }

  if (!validator.isStrongPassword(password)) {
    throw Error("Password is not strong enough.");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("Email already in use.");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({
    email,
    password: hash,
  });

  return user;
};

// Static Login Method
userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("All field must be filled.");
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw Error("Incorrect credentials.");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw Error("Incorrect credentials.");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
