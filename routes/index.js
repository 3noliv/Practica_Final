const express = require("express");
const router = express.Router();

const userRoutes = require("./user");
const clientRoutes = require("./client");
const projectRoutes = require("./project");
const deliverynoteRoutes = require("./deliverynote");

router.use("/user", userRoutes);
router.use("/client", clientRoutes);
router.use("/project", projectRoutes);
router.use("/deliverynote", deliverynoteRoutes);

module.exports = router;
