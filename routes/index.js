const express = require("express");
const router = express.Router();

const userRoutes = require("./user");

// Prefijo para las rutas de usuario
router.use("/user", userRoutes);

module.exports = router;
