const handleHttpError = (res, err, defaultMsg = "Algo salió mal") => {
  console.error("❌ Error capturado:", err);

  // 👉 Si te pasan un mensaje de error y además un statusCode (como tercer parámetro)
  if (typeof err === "string" && typeof defaultMsg === "number") {
    return res.status(defaultMsg).json({ error: err });
  }

  // Error de validación de mongoose
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Error al castear ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID inválido o mal formado" });
  }

  // Error JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token inválido o manipulado" });
  }

  // Token expirado
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ error: "Token expirado, vuelve a iniciar sesión" });
  }

  // Error de índice duplicado
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ error: "Ya existe un registro con ese valor único" });
  }

  // Por defecto
  return res.status(500).json({ error: defaultMsg });
};

module.exports = { handleHttpError };
