const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = async () => {
  try {
    const db_uri =
      process.env.NODE_ENV === "test"
        ? process.env.DB_URI_TEST
        : process.env.DB_URI;

    if (!db_uri) {
      throw new Error("Falta la variable DB_URI o DB_URI_TEST en el .env");
    }

    await mongoose.connect(db_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Conectado a la base de datos ${db_uri}`);
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error);
  }
};

module.exports = dbConnect;
