const { IncomingWebhook } = require("@slack/webhook");
const errorWebhook = new IncomingWebhook(process.env.SLACK_WEBHOOK);

const handleHttpError = async (res, err, defaultMsg = "Algo salió mal") => {
  console.error("❌ Error capturado:", err);

  // 1️⃣ Si te pasan mensaje y código manualmente
  if (typeof err === "string" && typeof defaultMsg === "number") {
    if (defaultMsg >= 500) await notifySlack(err, defaultMsg);
    return res.status(defaultMsg).json({ error: err });
  }

  // 2️⃣ Errores específicos
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ error: "ID inválido o mal formado" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token inválido o manipulado" });
  }

  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ error: "Token expirado, vuelve a iniciar sesión" });
  }

  if (err.code === 11000) {
    return res
      .status(409)
      .json({ error: "Ya existe un registro con ese valor único" });
  }

  // 3️⃣ Por defecto: error 500
  await notifySlack(err.message || defaultMsg, 500);
  return res.status(500).json({ error: defaultMsg });
};

// Función para enviar errores a Slack (solo 5XX)
const notifySlack = async (message, code) => {
  try {
    await errorWebhook.send({
      text: `🚨 *ERROR ${code}* → ${message}`,
    });
  } catch (e) {
    console.error("❌ No se pudo enviar el error a Slack:", e.message);
  }
};

module.exports = { handleHttpError };
