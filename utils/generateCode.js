// Función para generar un código de 6 dígitos aleatorio
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generateCode;
