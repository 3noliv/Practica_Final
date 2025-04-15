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
      return res
        .status(409)
        .json({
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

module.exports = {
  createClient,
};
