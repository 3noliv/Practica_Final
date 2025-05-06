const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Firma un JWT para el usuario.
 * Incluye `id` en lugar de `_id` para compatibilidad con el middleware.
 */
const tokenSign = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email, // opcional pero útil
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
};

/**
 * Verifica y decodifica un token JWT.
 */
const verifyToken = (tokenJwt) => {
  try {
    return jwt.verify(tokenJwt, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { tokenSign, verifyToken };
