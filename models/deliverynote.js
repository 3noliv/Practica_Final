const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const DeliveryNoteSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: mongoose.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    projectId: {
      type: mongoose.Types.ObjectId,
      ref: "Project",
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
DeliveryNoteSchema.plugin(mongooseDelete, { overrideMethods: "all" });

module.exports = mongoose.model("DeliveryNote", DeliveryNoteSchema);
