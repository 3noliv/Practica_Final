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
  changePassword,
  inviteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadLogo = require("../middlewares/uploadLogo");
const {
  validateRegister,
  validateLogin,
  validateCode,
  validateOnboarding,
  validateCompany,
  validatePasswordChange,
  validateInvitation,
} = require("../validators/userValidator");

const router = express.Router();

/**
 * @openapi
 * /api/user/register:
 *   put:
 *     tags:
 *       - Perfil
 *     summary: Completar onboarding con nombre, apellidos, NIF y estado de autónomo
 *     description: >
 *       Este endpoint permite al usuario completar su información personal.
 *       Si marca `autonomo: true`, sus datos personales se usarán más adelante
 *       como datos de empresa automáticamente.
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
 *                 example: Juan
 *               surname:
 *                 type: string
 *                 example: Pérez
 *               nif:
 *                 type: string
 *                 example: 12345678Z
 *               autonomo:
 *                 type: boolean
 *                 example: true
 *                 description: Si es true, los datos de la empresa se completarán con estos datos personales
 *     responses:
 *       200:
 *         description: Onboarding actualizado correctamente
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
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
 *     description: >
 *       Devuelve los datos personales, empresa, rol, email, y si el usuario es autónomo.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     autonomo:
 *                       type: boolean
 *                     personalData:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         surname:
 *                           type: string
 *                         nif:
 *                           type: string
 *                     companyData:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         cif:
 *                           type: string
 *                         address:
 *                           type: string
 *                     logoUrl:
 *                       type: string
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
 *     description: >
 *       Este endpoint actualiza los datos de la empresa del usuario autenticado.
 *       - Si el usuario **no es autónomo**, debe enviar `name`, `cif` y `address` en el body.
 *       - Si el usuario **es autónomo**, los datos de empresa se completarán automáticamente
 *         a partir de los datos personales (`name`, `surname`, `nif`) del usuario, por lo que **no es necesario enviar datos en el body**.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
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
 *           example:
 *             name: Empresa S.A.
 *             cif: B12345678
 *             address: Calle Falsa 123
 *     responses:
 *       200:
 *         description: Empresa actualizada correctamente
 *       400:
 *         description: Faltan datos personales si el usuario es autónomo
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno del servidor
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

/**
 * @openapi
 * /api/user/password:
 *   patch:
 *     tags:
 *       - Cuenta
 *     summary: Cambiar la contraseña actual (usuario autenticado)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.patch(
  "/password",
  authMiddleware,
  validatePasswordChange,
  changePassword
);

/**
 * @openapi
 * /api/user/invite:
 *   post:
 *     tags:
 *       - Cuenta
 *     summary: Invitar a un usuario como parte de tu compañía
 *     security:
 *       - bearerAuth: []
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
 *       201:
 *         description: Invitación enviada
 *       409:
 *         description: El email ya está registrado
 */
router.post("/invite", authMiddleware, validateInvitation, inviteUser);

module.exports = router;
