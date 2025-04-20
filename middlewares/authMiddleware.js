const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ajusta si usas index.js para modelos

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("🔴 No se proporcionó token");
    return res
      .status(401)
      .json({ message: "Acceso denegado, token no proporcionado" });
  }

  try {
    const tokenValue = token.replace("Bearer ", "");
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

    console.log("🟢 Token decodificado:", decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.user = user; // ← ahora sí contiene status, role, etc.
    next();
  } catch (error) {
    console.error("🔴 Token inválido:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = authMiddleware;
