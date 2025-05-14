const User = require("../models/User");
const { matchedData } = require("express-validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const generateCode = require("../utils/generateCode");
const { sendEmail } = require("../utils/handleEmail");
const { uploadToPinata } = require("../utils/handleUploadIPFS");
const { handleHttpError } = require("../utils/handleError");
const { tokenSign } = require("../utils/handleJwt");

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

// Registro de usuario
const registerUser = async (req, res) => {
  try {
    const bodyClean = matchedData(req);

    if (!bodyClean.email || !bodyClean.password) {
      return res
        .status(400)
        .json({ message: "Email y password son obligatorios" });
    }

    const userExists = await User.findOne({ email: bodyClean.email });
    if (userExists) {
      return res.status(409).json({ message: "Email ya registrado" });
    }

    const verificationCode = generateCode();

    const newUser = new User({ ...bodyClean, verificationCode });
    await newUser.save();

    const token = await tokenSign(newUser);

    await sendEmail({
      to: newUser.email,
      subject: "Verificación de cuenta",
      text: `Tu código de verificación es: ${verificationCode}`,
      from: process.env.EMAIL,
    });

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
    const bodyClean = matchedData(req);

    const user = await User.findOne({ email: bodyClean.email });
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (user.status === "pending") {
      const token = await tokenSign(user);
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

    const isMatch = await bcrypt.compare(bodyClean.password, user.password);
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

    // Si el login es exitoso, reseteamos los intentos
    user.loginAttempts = 3;
    await user.save();

    const token = await tokenSign(user);

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
    const body = matchedData(req);
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    user.personalData = {
      name: body.name,
      surname: body.surname,
      nif: body.nif,
    };

    if (typeof body.autonomo === "boolean") {
      user.autonomo = body.autonomo;

      // Si es autónomo, copiamos automáticamente a companyData
      if (body.autonomo === true) {
        user.companyData = {
          name: `${body.name} ${body.surname}`,
          cif: body.nif,
          address: "Dirección no especificada",
        };
      }
    }

    await user.save();

    res.json({ message: "✅ Datos personales actualizados correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al actualizar los datos personales");
  }
};

const updateCompany = async (req, res) => {
  try {
    const body = matchedData(req);
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    if (user.autonomo) {
      const { name, surname, nif } = user.personalData;

      if (!name || !surname || !nif) {
        return res.status(400).json({
          message:
            "Faltan datos personales para completar los datos de la compañía como autónomo",
        });
      }

      user.companyData = {
        name: `${name} ${surname}`,
        cif: nif,
        address: "Dirección no especificada",
      };
    } else {
      user.companyData = {
        name: body.name,
        cif: body.cif,
        address: body.address,
      };
    }

    await user.save();

    res.json({
      message: "✅ Datos de la compañía actualizados correctamente",
      companyData: user.companyData,
    });
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

    if (req.file.size > MAX_LOGO_SIZE) {
      return res.status(400).json({
        message: "El tamaño máximo permitido para el logo es de 2MB",
      });
    }

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
    const body = matchedData(req);
    const user = await User.findOne({ email: body.email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No existe ningún usuario con ese email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpires = expires;
    await user.save();

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
    const body = matchedData(req);

    const user = await User.findOne({
      resetToken: body.token,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    user.password = body.newPassword;
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
    const body = matchedData(req);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "La contraseña actual no es correcta" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(body.newPassword, salt);
    await user.save();

    res.json({ message: "✅ Contraseña actualizada correctamente" });
  } catch (error) {
    handleHttpError(res, error, "Error al cambiar la contraseña");
  }
};

const inviteUser = async (req, res) => {
  try {
    const body = matchedData(req);

    const existing = await User.findOne({ email: body.email });
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
      email: body.email,
      password: tempPassword,
      role: "guest",
      status: "pending",
      verificationCode,
      companyData: inviter.companyData,
    });

    await invitedUser.save();

    await sendEmail({
      to: body.email,
      subject: "Invitación para unirse a la compañía",
      text: `
Has sido invitado a unirte a la compañía de ${inviter.email} como usuario guest.

📧 Email: ${body.email}
🔐 Contraseña temporal: ${tempPassword}
✅ Código de verificación: ${verificationCode}

¡Bienvenido!
      `,
      from: process.env.EMAIL,
    });

    res.status(201).json({
      message: `Invitación enviada a ${body.email}`,
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
