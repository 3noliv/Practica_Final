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
      return res.status(409).json({
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

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, client } = req.body;

    const project = await Project.findById(projectId);

    if (!project || project.deleted) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (String(project.owner) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar este proyecto" });
    }

    // Si cambian el nombre y el cliente, comprobamos duplicado
    if (
      name &&
      client &&
      (name !== project.name || client !== String(project.client))
    ) {
      const duplicate = await Project.findOne({
        name,
        client,
        owner: req.user.id,
        _id: { $ne: projectId }, // Excluirse a sí mismo
      });
      if (duplicate) {
        return res.status(409).json({
          message: "Ya existe un proyecto con ese nombre y cliente",
        });
      }
    }

    Object.assign(project, req.body);
    await project.save();

    res.json({ message: "✅ Proyecto actualizado correctamente", project });
  } catch (error) {
    handleHttpError(res, "ERROR_UPDATE_PROJECT");
  }
};

module.exports = {
  createProject,
  updateProject,
};
