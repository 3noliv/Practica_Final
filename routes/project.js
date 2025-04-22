const express = require("express");
const router = express.Router();
const {
  createProject,
  updateProject,
  getProjects,
  getProjectById,
  deleteProject,
} = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  validateCreateProject,
  validateUpdateProject,
} = require("../validators/projectValidator");

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

/**
 * @openapi
 * /api/project/{id}:
 *   put:
 *     tags:
 *       - Proyectos
 *     summary: Editar un proyecto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del proyecto a editar
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
 *               description:
 *                 type: string
 *               client:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Proyecto actualizado correctamente
 *       404:
 *         description: Proyecto no encontrado
 *       409:
 *         description: Proyecto duplicado
 */
router.put("/:id", authMiddleware, validateUpdateProject, updateProject);

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags:
 *       - Proyectos
 *     summary: Obtener todos los proyectos del usuario o de su compañía
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos disponibles
 *       401:
 *         description: No autorizado
 */
router.get("/", authMiddleware, getProjects);

/**
 * @openapi
 * /api/project/{id}:
 *   get:
 *     tags:
 *       - Proyectos
 *     summary: Obtener un proyecto por su ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto a consultar
 *     responses:
 *       200:
 *         description: Datos del proyecto
 *       404:
 *         description: Proyecto no encontrado o no autorizado
 */
router.get("/:id", authMiddleware, getProjectById);

/**
 * @openapi
 * /api/project/{id}:
 *   delete:
 *     tags:
 *       - Proyectos
 *     summary: Archivar o eliminar permanentemente un proyecto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del proyecto a eliminar
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         required: false
 *         description: true (por defecto) para soft delete, false para eliminar definitivamente
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Proyecto archivado o eliminado correctamente
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
