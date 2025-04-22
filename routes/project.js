const express = require("express");
const router = express.Router();
const { createProject } = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateCreateProject } = require("../validators/projectValidator");

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags:
 *       - Proyectos
 *     summary: Crear nuevo proyecto
 *     description: Crea un nuevo proyecto asociado al usuario autenticado y un cliente existente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, client]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               client:
 *                 type: string
 *                 description: ID del cliente (MongoDB)
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *       409:
 *         description: Ya existe un proyecto con ese nombre y cliente para ese usuario
 *       401:
 *         description: No autorizado
 */
router.post("/", authMiddleware, validateCreateProject, createProject);

module.exports = router;
