const Client = require("../models/Client");

const createClient = async (req, res) => {
  try {
    const { name, cif, address, contactEmail, contactPhone } = req.body;

    const user = req.user;

    // Verificar que el usuario esté verificado
    if (user.status !== "verified") {
      return res.status(403).json({ message: "Cuenta no verificada" });
    }

    // Buscar si ya existe un cliente con ese CIF para ese usuario o su compañía
    const existing = await Client.findOne({
      cif,
      $or: [{ createdBy: user._id }, { companyId: user.companyData?.cif }],
    });

    if (existing) {
      return res.status(409).json({
        message: "Este cliente ya está registrado por ti o tu compañía",
      });
    }

    const newClient = new Client({
      name,
      cif,
      address,
      contactEmail,
      contactPhone,
      createdBy: user._id,
      companyId: user.companyData?.cif,
    });

    await newClient.save();

    res.status(201).json({
      message: "Cliente creado correctamente",
      client: newClient,
    });
  } catch (error) {
    console.error("❌ Error al crear cliente:", error);
    res.status(500).json({ message: "Error al crear cliente" });
  }
};

const updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const user = req.user;
    const updateData = req.body;

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Permitir solo si es el creador o pertenece a la misma compañía
    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return res.status(403).json({
        message: "No tienes permisos para modificar este cliente",
      });
    }

    Object.assign(client, updateData);
    await client.save();

    res.json({ message: "Cliente actualizado correctamente", client });
  } catch (error) {
    console.error("❌ Error actualizando cliente:", error);
    res.status(500).json({ message: "Error al actualizar cliente" });
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
    console.error("❌ Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Permitir solo si es el creador o pertenece a la misma compañía
    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para ver este cliente" });
    }

    res.json({ client });
  } catch (error) {
    console.error("❌ Error al obtener cliente:", error);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
};

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const soft = req.query.soft !== "false";
    const user = req.user;

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para eliminar este cliente" });
    }

    if (soft) {
      await client.delete(); // Soft delete (archivado)
      return res.json({ message: "Cliente archivado correctamente" });
    } else {
      await client.deleteOne(); // Hard delete
      return res.json({ message: "Cliente eliminado permanentemente" });
    }
  } catch (error) {
    console.error("❌ Error al eliminar cliente:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
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
    console.error("❌ Error al obtener archivados:", error);
    res.status(500).json({ message: "Error al obtener clientes archivados" });
  }
};
const restoreClient = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const client = await Client.findOneDeleted({ _id: id });

    if (!client) {
      return res
        .status(404)
        .json({ message: "Cliente no encontrado o no archivado" });
    }

    if (
      !client.createdBy.equals(user._id) &&
      client.companyId !== user.companyData?.cif
    ) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para restaurar este cliente" });
    }

    await Client.restore({ _id: id });

    res.json({ message: "✅ Cliente restaurado correctamente" });
  } catch (error) {
    console.error("❌ Error al restaurar cliente:", error);
    res.status(500).json({ message: "Error al restaurar cliente" });
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
