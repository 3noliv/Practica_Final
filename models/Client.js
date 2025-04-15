const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    cif: {
      type: String,
      required: true,
      match: /^[A-Z]\d{8}$/, // ejemplo: B12345678
    },
    address: {
      type: String,
    },
    contactEmail: {
      type: String,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // opcional pero válido
    },
    contactPhone: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: String, // lo extraemos de user.companyData.cif por simplicidad
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Soft delete
ClientSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Client", ClientSchema);
