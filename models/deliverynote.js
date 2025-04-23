const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const DeliveryNoteScheme = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
    clientId: {
      type: mongoose.Types.ObjectId,
      ref: "clients",
      required: true,
    },
    projectId: {
      type: mongoose.Types.ObjectId,
      ref: "projects",
      required: true,
    },
    type: {
      type: String,
      enum: ["horas", "materiales"],
      required: true,
    },
    entries: [
      {
        name: String,
        quantity: Number,
        unit: String,
        description: String,
      },
    ],
    signed: {
      type: Boolean,
      default: false,
    },
    signatureUrl: {
      type: String,
      default: null,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Soft delete
DeliveryNoteScheme.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model("deliverynotes", DeliveryNoteScheme);
