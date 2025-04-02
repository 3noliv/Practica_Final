const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email no válido"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "disabled"],
      default: "pending",
    },
    role: {
      type: String,
      enum: ["user", "admin", "guest"],
      default: "user",
    },
    verificationCode: {
      type: String,
      required: true,
    },
    verificationAttempts: {
      type: Number,
      default: 3,
    },
    loginAttempts: {
      type: Number,
      default: 3,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },
    personalData: {
      name: String,
      surname: String,
      nif: String,
    },
    companyData: {
      name: String,
      cif: String,
      address: String,
    },
    logoUrl: String,
  },
  { timestamps: true }
);

// Encriptar contraseña antes de guardar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("User", UserSchema);
