const { check } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validateCreateProject = [
  check("name")
    .exists()
    .withMessage("El nombre del proyecto es obligatorio")
    .notEmpty()
    .withMessage("El nombre no puede estar vacío"),

  check("client")
    .exists()
    .withMessage("El ID del cliente es obligatorio")
    .isMongoId()
    .withMessage("Debe ser un ID válido de Mongo"),

  check("description").optional().isString(),

  check("startDate")
    .optional()
    .isISO8601()
    .withMessage("Debe ser una fecha válida (ISO)"),

  check("endDate")
    .optional()
    .isISO8601()
    .withMessage("Debe ser una fecha válida (ISO)"),

  (req, res, next) => validateResults(req, res, next),
];

const validateUpdateProject = [
  check("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío"),

  check("description").optional().isString(),

  check("client")
    .optional()
    .isMongoId()
    .withMessage("Debe ser un ID válido de cliente"),

  check("startDate").optional().isISO8601(),

  check("endDate").optional().isISO8601(),

  (req, res, next) => validateResults(req, res, next),
];

module.exports = {
  validateCreateProject,
  validateUpdateProject,
};
