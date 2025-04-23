const { check, body } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validatorCreateDeliveryNote = [
  check("type")
    .exists()
    .notEmpty()
    .withMessage("El tipo es obligatorio")
    .isIn(["horas", "materiales"])
    .withMessage("Debe ser 'horas' o 'materiales'"),

  check("projectId")
    .exists()
    .notEmpty()
    .withMessage("El ID del proyecto es obligatorio")
    .isMongoId()
    .withMessage("Debe ser un ID válido"),

  check("clientId")
    .exists()
    .notEmpty()
    .withMessage("El ID del cliente es obligatorio")
    .isMongoId()
    .withMessage("Debe ser un ID válido"),

  check("entries")
    .isArray({ min: 1 })
    .withMessage("Debe incluir al menos una entrada"),

  body("entries.*.name")
    .exists()
    .notEmpty()
    .withMessage("Cada entrada debe tener un nombre"),

  body("entries.*.quantity")
    .exists()
    .notEmpty()
    .withMessage("Cada entrada debe tener una cantidad")
    .isNumeric()
    .withMessage("La cantidad debe ser un número"),

  body("entries.*.unit").optional().isString(),

  body("entries.*.description").optional().isString(),

  (req, res, next) => validateResults(req, res, next),
];

module.exports = {
  validatorCreateDeliveryNote,
};
