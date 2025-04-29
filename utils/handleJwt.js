const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Firma un JWT para el usuario.
 * @param {*} user
 * @returns token
 */
const tokenSign = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
};

/**
 * Verifica y decodifica un token JWT.
 * @param {*} tokenJwt
 * @returns objeto con los datos del token o null si falla
 */
const verifyToken = (tokenJwt) => {
  try {
    return jwt.verify(tokenJwt, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { tokenSign, verifyToken };
