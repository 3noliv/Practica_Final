const mongoose = require("mongoose");
const mongooseDelete = require("mongoose-delete");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client", // asegúrate de que tu modelo de cliente se llame así
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // usuario que creó el proyecto
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // opcional, si quieres enlazarlo a la compañía directamente
    },
    startDate: Date,
    endDate: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProjectSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: "all",
});

module.exports = mongoose.model("Project", ProjectSchema);
