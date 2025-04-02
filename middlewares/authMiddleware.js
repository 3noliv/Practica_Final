const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("🔴 No se proporcionó token");
    return res
      .status(401)
      .json({ message: "Acceso denegado, token no proporcionado" });
  }

  try {
    const tokenValue = token.replace("Bearer ", ""); // Elimina "Bearer " si está presente
    const verified = jwt.verify(tokenValue, process.env.JWT_SECRET);

    console.log("🟢 Token decodificado:", verified);

    req.user = verified; // Asigna el usuario decodificado a la request
    next();
  } catch (error) {
    console.error("🔴 Token inválido:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = authMiddleware;
