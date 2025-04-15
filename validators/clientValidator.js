const { check } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validateCreateClient = [
  check("name")
    .exists()
    .withMessage("El nombre es obligatorio")
    .notEmpty()
    .withMessage("El nombre no puede estar vacío"),

  check("cif")
    .exists()
    .withMessage("El CIF es obligatorio")
    .matches(/^[A-Z]\d{8}$/)
    .withMessage("El CIF debe comenzar por una letra seguida de 8 números"),

  check("contactEmail")
    .optional()
    .isEmail()
    .withMessage("El email de contacto no es válido"),

  check("contactPhone").optional().isString(),

  check("address").optional().isString(),

  (req, res, next) => validateResults(req, res, next),
];

module.exports = {
  validateCreateClient,
};
