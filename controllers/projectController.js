const Project = require("../models/Projects");
const { matchedData } = require("express-validator");
const { handleHttpError } = require("../utils/handleError");

/**
 * Crear un nuevo proyecto
 */
const createProject = async (req, res) => {
  try {
    const body = matchedData(req);

    const owner = req.user.id;
    const companyId = req.user.companyId || null;

    const exists = await Project.findOne({
      name: body.name,
      client: body.client,
      owner,
    });

    if (exists) {
      return res.status(409).json({
        message: "Ya existe un proyecto con ese nombre para ese cliente",
      });
    }

    const newProject = await Project.create({
      ...body,
      owner,
      companyId,
    });

    res.status(201).json({ project: newProject });
  } catch (error) {
    handleHttpError(res, "ERROR_CREATE_PROJECT");
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const body = matchedData(req);

    const project = await Project.findById(projectId);

    if (!project || project.deleted) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (String(project.owner) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar este proyecto" });
    }

    if (
      body.name &&
      body.client &&
      (body.name !== project.name || body.client !== String(project.client))
    ) {
      const duplicate = await Project.findOne({
        name: body.name,
        client: body.client,
        owner: req.user.id,
        _id: { $ne: projectId },
      });
      if (duplicate) {
        return res.status(409).json({
          message: "Ya existe un proyecto con ese nombre y cliente",
        });
      }
    }

    Object.assign(project, body);
    await project.save();

    res.json({ message: "✅ Proyecto actualizado correctamente", project });
  } catch (error) {
    handleHttpError(res, "ERROR_UPDATE_PROJECT");
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const query = {
      $or: [{ owner: userId }, { companyId: companyId }],
    };

    const projects = await Project.find(query)
      .populate("client", "name") // opcional: solo traemos el nombre del cliente
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    handleHttpError(res, "ERROR_GET_PROJECTS");
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const project = await Project.findOne({
      _id: projectId,
      $or: [{ owner: userId }, { companyId: companyId }],
    }).populate("client", "name");

    if (!project) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.json({ project });
  } catch (error) {
    handleHttpError(res, "ERROR_GET_PROJECT_BY_ID");
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const soft = req.query.soft !== "false";

    const project = await Project.findById(projectId);
    if (!project || project.deleted) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    // Verificación de permisos
    if (String(project.owner) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar este proyecto" });
    }

    if (soft) {
      await project.delete();
      res.json({
        message: "✅ Proyecto archivado correctamente (soft delete)",
      });
    } else {
      await project.deleteOne();
      res.json({
        message: "🗑️ Proyecto eliminado permanentemente (hard delete)",
      });
    }
  } catch (error) {
    handleHttpError(res, "ERROR_DELETE_PROJECT");
  }
};

const getArchivedProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId;

    const query = {
      $or: [{ owner: userId }, { companyId: companyId }],
    };

    const projects = await Project.findDeleted(query).populate(
      "client",
      "name"
    );

    res.json({ archived: projects });
  } catch (error) {
    handleHttpError(res, "ERROR_GET_ARCHIVED_PROJECTS");
  }
};

const restoreProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findOneDeleted({ _id: projectId });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Proyecto no archivado o inexistente" });
    }

    if (String(project.owner) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para restaurar este proyecto" });
    }

    await Project.restore({ _id: projectId });

    res.json({ message: "✅ Proyecto restaurado correctamente" });
  } catch (error) {
    handleHttpError(res, "ERROR_RESTORE_PROJECT");
  }
};

module.exports = {
  createProject,
  updateProject,
  getProjects,
  getProjectById,
  deleteProject,
  getArchivedProjects,
  restoreProject,
};
