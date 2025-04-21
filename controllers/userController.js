const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const generateCode = require("../utils/generateCode");
const { sendEmail } = require("../utils/handleEmail");
const { uploadToPinata } = require("../utils/handleUploadIPFS");
const { handleHttpError } = require("../utils/handleError");

// Registro de usuario
const registerUser = async (req, res) => {
  try {
    console.log("🟢 Recibiendo datos:", req.body);
    const data = req.body;

    if (!data.email || !data.password) {
      return res
        .status(400)
        .json({ message: "Email y password son obligatorios" });
    }

    const userExists = await User.findOne({ email: data.email });
    if (userExists) {
      console.log("🔴 Email ya registrado");
      return res.status(409).json({ message: "Email ya registrado" });
    }

    const verificationCode = generateCode();
    console.log("🟢 Código de verificación generado:", verificationCode);

    const newUser = new User({ ...data, verificationCode });
    await newUser.save();
    console.log("✅ Usuario guardado en la base de datos");

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Enviar email con el código de verificación
    await sendEmail({
      to: newUser.email,
      subject: "Verificación de cuenta",
      text: `Tu código de verificación es: ${verificationCode}`,
      from: process.env.EMAIL,
    });

    console.log("📧 Email de verificación enviado");

    res.status(201).json({
      user: {
        email: newUser.email,
        status: newUser.status,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    handleHttpError(res, error, "Error en el registro");
  }
};

// Validación del email
const validateEmail = async (req, res) => {
  try {
    console.log("🟢 Token recibido:", req.user);
    const { code } = req.body;
    console.log("🟢 Código recibido:", code);

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log("🔴 Usuario no encontrado");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.status === "disabled") {
      return res
        .status(403)
        .json({ message: "Esta cuenta está deshabilitada." });
    }

    console.log("🟢 Código en BD:", user.verificationCode);

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;

      if (user.verificationAttempts <= 0) {
        user.status = "disabled";
        await user.save();
        return res.status(403).json({
          message: "Cuenta deshabilitada por demasiados intentos fallidos.",
        });
      }

      await user.save();
      return res.status(400).json({
        message: `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`,
      });
    }

    user.status = "verified";
    await user.save();
    console.log("✅ Email validado correctamente");

    res.json({ message: "Email validado correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error en la validación");
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    console.log("🟢 Recibiendo datos de login:", req.body);

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("🔴 Usuario no encontrado");
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    console.log("🟢 Usuario encontrado:", user.email);

    if (user.status === "pending") {
      // Permitimos login, pero advertimos que aún no está verificado
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        message: "Tu cuenta está pendiente de verificación",
        user: { email: user.email, role: user.role, status: user.status },
        token,
      });
    }

    if (user.status === "disabled") {
      return res
        .status(403)
        .json({ message: "Tu cuenta ha sido deshabilitada." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts -= 1;

      if (user.loginAttempts <= 0) {
        user.status = "disabled";
        await user.save();
        return res.status(403).json({
          message:
            "Tu cuenta ha sido deshabilitada por múltiples intentos fallidos de login.",
        });
      }

      await user.save();
      return res.status(401).json({
        message: `Credenciales inválidas. Intentos restantes: ${user.loginAttempts}`,
      });
    }

    // Resetear intentos si el login fue correcto
    user.loginAttempts = 3;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ Login exitoso, enviando token");
    res.json({ user: { email: user.email, role: user.role }, token });
  } catch (error) {
    handleHttpError(res, error, "Error en el login");
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -verificationCode -__v"
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ user });
  } catch (error) {
    handleHttpError(res, error, "Error al obtener el usuario");
  }
};

const updateOnboarding = async (req, res) => {
  try {
    const { name, surname, nif } = req.body;

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    user.personalData = { name, surname, nif };
    await user.save();

    res.json({ message: "✅ Datos personales actualizados correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al actualizar los datos personales");
  }
};

const updateCompany = async (req, res) => {
  try {
    const { name, cif, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    user.companyData = { name, cif, address };
    await user.save();

    res.json({ message: "✅ Datos de la compañía actualizados correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al actualizar los datos de la compañía");
  }
};

const updateLogo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    if (!req.file)
      return res
        .status(400)
        .json({ message: "No se ha subido ningún archivo" });

    // Subir a IPFS vía Pinata
    const pinataRes = await uploadToPinata(
      req.file.buffer,
      req.file.originalname
    );
    const ipfsUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${pinataRes.IpfsHash}`;

    user.logoUrl = ipfsUrl;
    await user.save();

    res.json({
      message: "✅ Logo subido a IPFS correctamente",
      logoUrl: ipfsUrl,
    });
  } catch (error) {
    handleHttpError(res, error, "Error al subir el logo a IPFS");
  }
};

const deleteUser = async (req, res) => {
  try {
    const soft = req.query.soft !== "false"; // Por defecto true

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (soft) {
      await user.delete(); // Soft delete usando mongoose-delete
      return res.json({ message: "✅ Usuario deshabilitado correctamente" });
    } else {
      await user.deleteOne(); // Hard delete definitivo
      return res.json({ message: "🗑️ Usuario eliminado permanentemente" });
    }
  } catch (error) {
    handleHttpError(res, error, "Error al eliminar el usuario");
  }
};

const restoreUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user.deleted) {
      return handleHttpError(res, "El usuario no está archivado", 400);
    }

    await User.restore({ _id: user._id });
    await User.findByIdAndUpdate(user._id, {
      loginAttempts: 3,
      status: "verified",
    });

    res.json({ message: "✅ Usuario restaurado correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al restaurar el usuario");
  }
};

const recoverPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No existe ningún usuario con ese email" });
    }

    // Generamos un token aleatorio (puedes usar uuid también)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    user.resetToken = resetToken;
    user.resetTokenExpires = expires;
    await user.save();

    console.log(`🔐 Token de recuperación para ${email}: ${resetToken}`);

    await sendEmail({
      to: user.email,
      subject: "Recuperación de contraseña",
      text: `Tu token de recuperación es: ${resetToken}`,
      from: process.env.EMAIL,
    });

    res.json({
      message:
        "Token de recuperación generado y enviado por correo electrónico",
    });
  } catch (error) {
    handleHttpError(
      res,
      error,
      "Error al iniciar la recuperación de contraseña"
    );
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }, // aún válido
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Cambiar la contraseña y limpiar el token
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: "✅ Contraseña actualizada correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al restablecer la contraseña");
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "La contraseña actual no es correcta" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "✅ Contraseña actualizada correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al cambiar la contraseña");
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;

    // Verificar que no exista ese email ya registrado
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Ese correo ya está registrado" });
    }

    const inviter = await User.findById(req.user.id);

    if (!inviter || inviter.status !== "verified") {
      return res.status(403).json({ message: "No autorizado para invitar" });
    }

    const verificationCode = generateCode();

    const tempPassword = crypto.randomBytes(8).toString("hex");

    const invitedUser = new User({
      email,
      password: tempPassword,
      role: "guest",
      status: "pending",
      verificationCode,
      companyData: inviter.companyData,
    });

    await invitedUser.save();

    await sendEmail({
      to: email,
      subject: "Invitación para unirse a la compañía",
      text: `
    ¡Hola!
    
    Has sido invitado a unirte a la compañía de ${inviter.email} como usuario guest.
    
    Aquí tienes tus credenciales temporales para acceder:
    
    📧 Email: ${email}
    🔐 Contraseña temporal: ${tempPassword}
    ✅ Código de verificación: ${verificationCode}
    
    👉 Por favor, accede a la plataforma, inicia sesión y valida tu cuenta con el código anterior.
    
    ¡Bienvenido!
      `,
      from: process.env.EMAIL,
    });

    res.status(201).json({
      message: `Invitación enviada a ${email}`,
    });
  } catch (error) {
    handleHttpError(res, error, "Error al invitar usuario");
  }
};

module.exports = {
  registerUser,
  validateEmail,
  loginUser,
  updateOnboarding,
  updateCompany,
  updateLogo,
  getCurrentUser,
  deleteUser,
  restoreUser,
  recoverPassword,
  resetPassword,
  changePassword,
  inviteUser,
};
