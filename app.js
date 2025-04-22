const express = require("express");
const setupSwagger = require("./docs/swagger");
const cors = require("cors");
require("dotenv").config();
const morganBody = require("morgan-body");
const loggerStream = require("./utils/handleLogger");

const dbConnect = require("./config/mongo");
const routes = require("./routes");

const app = express();
setupSwagger(app);

app.use(cors());
app.use(express.json());

morganBody(app, {
  noColors: true,
  skip: function (req, res) {
    return res.statusCode < 400; // Solo errores
  },
  stream: loggerStream,
});

// Usar el index de rutas con prefijo /api
app.use("/api", routes);

// Conectar a la base de datos
dbConnect();

const PORT = process.env.PORT || 3000;

let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.clear();
    console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
