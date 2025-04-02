const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = async () => {
  try {
    const db_uri = process.env.DB_URI;
    if (!db_uri) {
      throw new Error("Falta la variable DB_URI en el archivo .env");
    }

    await mongoose.connect(db_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Conectado a la base de datos MongoDB");
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
  }
};

module.exports = dbConnect;
