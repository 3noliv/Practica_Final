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
      ref: "Client",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: String, // CIF o DNI de quien crea el proyecto (empresa o autónomo)
      required: true,
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
