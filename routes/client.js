const express = require("express");
const router = express.Router();

const { createClient } = require("../controllers/clientController");
const { validateCreateClient } = require("../validators/clientValidator");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags:
 *       - Clientes
 *     summary: Crear un nuevo cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cif
 *             properties:
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado correctamente
 *       409:
 *         description: Cliente ya registrado
 *       403:
 *         description: Usuario no verificado
 */
router.post("/", authMiddleware, validateCreateClient, createClient);

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags:
 *       - Clientes
 *     summary: Editar un cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente
 */
router.put("/:id", authMiddleware, validateCreateClient, updateClient);

module.exports = router;
