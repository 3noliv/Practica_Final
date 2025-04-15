const express = require("express");
const router = express.Router();

const userRoutes = require("./user");
const clientRoutes = require("./client");

// Prefijo para las rutas de usuario
router.use("/user", userRoutes);
router.use("/client", clientRoutes);

module.exports = router;
