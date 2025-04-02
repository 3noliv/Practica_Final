const express = require("express");
const setupSwagger = require("./config/swagger");
const cors = require("cors");
require("dotenv").config();

const dbConnect = require("./config/mongo");
const routes = require("./routes");

const app = express();
setupSwagger(app);

app.use(cors());
app.use(express.json());

// Usar el index de rutas con prefijo /api
app.use("/api", routes);

// Conectar a la base de datos
dbConnect();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en http://localhost:${PORT}`);
});
