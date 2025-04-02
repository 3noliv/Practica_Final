const express = require("express");
const {
  registerUser,
  validateEmail,
  loginUser,
  updateOnboarding,
  updateCompany,
  updateLogo,
  getCurrentUser,
  deleteUser,
  recoverPassword,
  resetPassword,
  restoreUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadLogo = require("../middlewares/uploadLogo");
const {
  validateRegister,
  validateLogin,
  validateCode,
  validateOnboarding,
  validateCompany,
} = require("../validators/userValidator");

const router = express.Router();

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registro de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 */
router.post("/register", validateRegister, registerUser);

/**
 * @openapi
 * /api/user/validation:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Validación del email con código
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email validado correctamente
 */
router.put("/validation", authMiddleware, validateCode, validateEmail);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login correcto, retorna token
 *       401:
 *         description: Credenciales inválidas o cuenta deshabilitada
 *       403:
 *         description: Cuenta no verificada o deshabilitada
 */
router.post("/login", validateLogin, loginUser);

/**
 * @openapi
 * /api/user/recover:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Generar token para recuperar contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token generado (ver consola o BD)
 */
router.post("/recover", recoverPassword);

/**
 * @openapi
 * /api/user/reset-password:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Restablecer contraseña usando token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 */
router.put("/reset-password", resetPassword);

/**
 * @openapi
 * /api/user/me:
 *   get:
 *     tags:
 *       - Perfil
 *     summary: Obtener datos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 */
router.get("/me", authMiddleware, getCurrentUser);

/**
 * @openapi
 * /api/user/register:
 *   put:
 *     tags:
 *       - Perfil
 *     summary: Completar onboarding con nombre, apellidos y NIF
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, surname, nif]
 *             properties:
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               nif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Onboarding actualizado correctamente
 */
router.put("/register", authMiddleware, validateOnboarding, updateOnboarding);

/**
 * @openapi
 * /api/user/company:
 *   patch:
 *     tags:
 *       - Perfil
 *     summary: Actualizar datos de la empresa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif, address]
 *             properties:
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Empresa actualizada correctamente
 */
router.patch("/company", authMiddleware, validateCompany, updateCompany);

/**
 * @openapi
 * /api/user/logo:
 *   patch:
 *     tags:
 *       - Perfil
 *     summary: Subida del logo del usuario (IPFS)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo actualizado correctamente
 */
router.patch("/logo", authMiddleware, uploadLogo.single("logo"), updateLogo);

/**
 * @openapi
 * /api/user:
 *   delete:
 *     tags:
 *       - Cuenta
 *     summary: Eliminar usuario (soft o hard delete con mongoose-delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: true (soft delete con .delete()) o false (hard delete con .deleteOne())
 *     responses:
 *       200:
 *         description: Usuario eliminado o deshabilitado correctamente
 */
router.delete("/", authMiddleware, deleteUser);

/**
 * @openapi
 * /api/user/restore:
 *   put:
 *     tags:
 *       - Cuenta
 *     summary: Restaurar usuario previamente eliminado (soft delete)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario restaurado correctamente
 */
router.put("/restore", authMiddleware, restoreUser);

module.exports = router;
