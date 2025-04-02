const { validationResult } = require("express-validator");

const validateResults = (req, res, next) => {
  try {
    validationResult(req).throw(); // Lanza un error si hay validaciones fallidas
    return next(); // Si todo está bien, continúa con el siguiente middleware/controlador
  } catch (err) {
    res.status(400).json({ errors: err.array() });
  }
};

module.exports = validateResults;
