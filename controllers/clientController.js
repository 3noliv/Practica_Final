const Client = require("../models/Client");
const { matchedData } = require("express-validator");
const { handleHttpError } = require("../utils/handleError");

const createClient = async (req, res) => {
  try {
    const body = matchedData(req);
    const user = req.user;

    if (user.status !== "verified") {
      return handleHttpError(res, "Cuenta no verificada", 403);
    }

    const existing = await Client.findOne({
      cif: body.cif,
      $or: [{ createdBy: user._id }, { companyId: user.companyData?.cif }],
    });

    if (existing) {
      return handleHttpError(
        res,
        "Este cliente ya está registrado por ti o tu compañía",
        409
      );
    }

    const newClient = new Client({
      ...body,
      createdBy: user._id,
      companyId: user.companyData?.cif,
    });

    await newClient.save();

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    handleHttpError(res, error, "Error al crear cliente");
  }
};

const updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const body = matchedData(req);
    const user = req.user;

    const client = await Client.findById(clientId);

    if (!client) {
      return handleHttpError(res, "Cliente no encontrado", 404);
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return handleHttpError(
        res,
        "No tienes permisos para modificar este cliente",
        403
      );
    }

    Object.assign(client, body);
    await client.save();

    res.json({ message: "Cliente actualizado correctamente", client });
  } catch (error) {
    handleHttpError(res, error, "Error al actualizar cliente");
  }
};

const getClients = async (req, res) => {
  try {
    const user = req.user;

    const query = {
      $or: [{ createdBy: user._id }, { companyId: user.companyData?.cif }],
    };

    const clients = await Client.find(query).sort({ createdAt: -1 });

    res.json({ clients });
  } catch (error) {
    handleHttpError(res, error, "Error al obtener clientes");
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findById(id);

    if (!client) {
      return handleHttpError(res, "Cliente no encontrado", 404);
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return handleHttpError(
        res,
        "No tienes permisos para ver este cliente",
        403
      );
    }

    res.json({ client });
  } catch (error) {
    handleHttpError(res, error, "Error al obtener cliente");
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const soft = req.query.soft !== "false";
    const user = req.user;

    const client = await Client.findById(id);

    if (!client) {
      return handleHttpError(res, "Cliente no encontrado", 404);
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return handleHttpError(
        res,
        "No tienes permisos para eliminar este cliente",
        403
      );
    }

    if (soft) {
      await client.delete();
      return res.json({ message: "Cliente archivado correctamente" });
    } else {
      await client.deleteOne();
      return res.json({ message: "Cliente eliminado permanentemente" });
    }
  } catch (error) {
    handleHttpError(res, error, "Error al eliminar cliente");
  }
};

const getArchivedClients = async (req, res) => {
  try {
    const user = req.user;

    const query = {
      $or: [{ createdBy: user._id }, { companyId: user.companyData?.cif }],
    };

    const clients = await Client.findDeleted(query).sort({ deletedAt: -1 });

    res.json({ archived: clients });
  } catch (error) {
    handleHttpError(res, error, "Error al obtener clientes archivados");
  }
};

const restoreClient = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findOneDeleted({ _id: id });

    if (!client) {
      return handleHttpError(res, "Cliente no encontrado o no archivado", 404);
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return handleHttpError(
        res,
        "No tienes permisos para restaurar este cliente",
        403
      );
    }

    await Client.restore({ _id: id });

    res.json({ message: "✅ Cliente restaurado correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al restaurar cliente");
  }
};

module.exports = {
  createClient,
  updateClient,
  getClients,
  getClientById,
  deleteClient,
  getArchivedClients,
  restoreClient,
};
