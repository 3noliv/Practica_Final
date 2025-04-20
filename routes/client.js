const express = require("express");
const router = express.Router();

const {
  createClient,
  updateClient,
  getClients,
  getClientById,
  deleteClient,
  getArchivedClients,
  restoreClient,
} = require("../controllers/clientController");
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

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Listar clientes propios o de la compañía
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get("/", authMiddleware, getClients);

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Listar clientes archivados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 */
router.get("/archived", authMiddleware, getArchivedClients);

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Obtener un cliente específico por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: No encontrado
 */
router.get("/:id", authMiddleware, getClientById);

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags:
 *       - Clientes
 *     summary: Eliminar o archivar un cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: soft
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Si es false, se elimina definitivamente
 *     responses:
 *       200:
 *         description: Cliente eliminado o archivado correctamente
 */
router.delete("/:id", authMiddleware, deleteClient);

/**
 * @openapi
 * /api/client/restore/{id}:
 *   put:
 *     tags:
 *       - Clientes
 *     summary: Restaurar un cliente archivado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente restaurado
 */
router.put("/restore/:id", authMiddleware, restoreClient);

module.exports = router;
