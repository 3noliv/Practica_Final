const Project = require("../models/Project");
const { handleHttpError } = require("../utils/handleError");

/**
 * Crear un nuevo proyecto
 */
const createProject = async (req, res) => {
  try {
    const { name, description, client, startDate, endDate } = req.body;

    const owner = req.user.id;
    const companyId = req.user.companyId || null;

    // Evitar duplicado (por nombre + cliente + propietario)
    const exists = await Project.findOne({ name, client, owner });
    if (exists) {
      return res
        .status(409)
        .json({
          message: "Ya existe un proyecto con ese nombre para ese cliente",
        });
    }

    const newProject = await Project.create({
      name,
      description,
      client,
      owner,
      companyId,
      startDate,
      endDate,
    });

    res.status(201).json({ project: newProject });
  } catch (error) {
    handleHttpError(res, "ERROR_CREATE_PROJECT");
  }
};

module.exports = {
  createProject,
};
