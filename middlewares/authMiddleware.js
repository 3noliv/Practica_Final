const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { handleHttpError } = require("../utils/handleError");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return handleHttpError(res, "No hay token", 401);
  }

  try {
    const tokenValue = token.replace("Bearer ", "");
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id;

    // ✅ Versión definitiva: buscar aunque esté soft-deleted
    const user = await User.findOneWithDeleted({ _id: userId });

    if (!user) {
      return handleHttpError(
        res,
        "Token inválido (usuario no encontrado)",
        401
      );
    }

    req.user = user;
    next();
  } catch (error) {
    handleHttpError(res, error, "Token inválido o expirado", 401);
  }
};

module.exports = authMiddleware;
