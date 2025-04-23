const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { validatorCreateDeliveryNote } = require("../validators/deliverynote");
const {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  generatePdf,
  signDeliveryNote,
  deleteDeliveryNote,
} = require("../controllers/deliverynote");
const { uploadMiddlewareMemory } = require("../utils/handleStorage");
const { validatorGetItem } = require("../validators/utils");

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags:
 *       - DeliveryNote
 *     summary: Crear un nuevo albarán
 *     description: Crea un albarán de horas o materiales, asociado a un usuario, cliente y proyecto.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - clientId
 *               - projectId
 *               - entries
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [horas, materiales]
 *               clientId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Albarán creado con éxito
 *       400:
 *         description: Error de validación
 */
router.post(
  "/",
  authMiddleware,
  validatorCreateDeliveryNote,
  createDeliveryNote
);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Obtener todos los albaranes del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de albaranes
 *       500:
 *         description: Error del servidor
 */
router.get("/", authMiddleware, getDeliveryNotes);

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Descargar albarán como PDF
 *     description: Genera y devuelve el PDF del albarán si el usuario tiene permisos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del albarán
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF generado correctamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Albarán no encontrado
 */
router.get("/pdf/:id", authMiddleware, generatePdf);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags:
 *       - DeliveryNote
 *     summary: Obtener un albarán específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del albarán
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán encontrado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */
router.get("/:id", authMiddleware, getDeliveryNote);

/**
 * @openapi
 * /api/deliverynote/sign/{id}:
 *   patch:
 *     tags:
 *       - DeliveryNote
 *     summary: Firmar un albarán
 *     description: Sube una imagen de firma a IPFS y marca el albarán como firmado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del albarán
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado con éxito
 *       400:
 *         description: Ya estaba firmado
 *       404:
 *         description: Albarán no encontrado
 */
router.patch(
  "/sign/:id",
  authMiddleware,
  uploadMiddlewareMemory.single("image"),
  signDeliveryNote
);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags:
 *       - DeliveryNote
 *     summary: Eliminar un albarán no firmado
 *     description: Elimina un albarán si no está firmado (soft delete).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del albarán
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       403:
 *         description: No se puede eliminar un albarán firmado
 *       404:
 *         description: Albarán no encontrado
 */
router.delete("/:id", authMiddleware, validatorGetItem, deleteDeliveryNote);

module.exports = router;
