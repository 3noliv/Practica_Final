const express = require("express");
const router = express.Router();

const userRoutes = require("./user");
const clientRoutes = require("./client");
const projectRoutes = require("./project");

router.use("/user", userRoutes);
router.use("/client", clientRoutes);
router.use("/project", projectRoutes);

module.exports = router;
