const { matchedData } = require("express-validator");
const { handleHttpError } = require("../utils/handleError");
const { uploadToPinata } = require("../utils/handleUploadIPFS");
const { deliverynotes } = require("../models/deliverynote");
const PDFDocument = require("pdfkit");
const getStream = require("get-stream");

// Crear albarán
const createDeliveryNote = async (req, res) => {
  try {
    const user = req.user;
    const body = matchedData(req);
    const data = await deliverynotesModel.create({
      ...body,
      createdBy: user._id,
    });
    res.send(data);
  } catch (err) {
    handleHttpError(res, "ERROR_CREATE_DELIVERYNOTE");
  }
};

// Listar todos los albaranes del usuario o su compañía
const getDeliveryNotes = async (req, res) => {
  try {
    const user = req.user;

    const query = {
      $or: [
        { createdBy: user._id },
        { createdBy: { $in: user.companyUsers || [] } },
      ],
    };

    const data = await deliverynotesModel
      .find(query)
      .populate("clientId")
      .populate("projectId");

    res.send(data);
  } catch (err) {
    handleHttpError(res, "ERROR_GET_DELIVERYNOTES");
  }
};

// Obtener un albarán por ID
const getDeliveryNote = async (req, res) => {
  try {
    const { id } = matchedData(req);

    const data = await deliverynotesModel
      .findById(id)
      .populate("createdBy")
      .populate("clientId")
      .populate("projectId");

    if (!data) {
      return handleHttpError(res, "DELIVERYNOTE_NOT_FOUND", 404);
    }

    // Comprobamos que sea del usuario o su compañía
    const user = req.user;
    const isAllowed =
      data.createdBy.equals(user._id) ||
      (user.companyUsers || []).includes(data.createdBy.toString());

    if (!isAllowed) {
      return handleHttpError(res, "NOT_ALLOWED", 403);
    }

    res.send(data);
  } catch (err) {
    handleHttpError(res, "ERROR_GET_DELIVERYNOTE");
  }
};

const generatePdf = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const user = req.user;

    const note = await deliverynotesModel
      .findById(id)
      .populate("createdBy")
      .populate("clientId")
      .populate("projectId");

    if (!note) return handleHttpError(res, "DELIVERYNOTE_NOT_FOUND", 404);

    const isOwner =
      note.createdBy._id.equals(user._id) ||
      (user.companyUsers || []).includes(note.createdBy._id.toString());
    if (!isOwner) return handleHttpError(res, "NOT_ALLOWED", 403);

    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdf = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="albaran-${id}.pdf"`
      );
      res.send(pdf);
    });

    doc.fontSize(18).text("ALBARÁN", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Usuario: ${note.createdBy.name}`);
    doc.text(`Cliente: ${note.clientId.name}`);
    doc.text(`Proyecto: ${note.projectId.name}`);
    doc.text(`Tipo: ${note.type}`);
    doc.moveDown();

    doc.text("Entradas:");
    note.entries.forEach((entry, i) => {
      doc.text(`  - ${entry.name}: ${entry.quantity} ${entry.unit || ""}`);
    });

    if (note.signed) {
      doc.moveDown();
      doc.text("FIRMADO ✅");
    }

    doc.end();
  } catch (err) {
    handleHttpError(res, "ERROR_GENERATE_PDF");
  }
};

const signDeliveryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    const note = await deliverynotesModel.findById(id);
    if (!note) return handleHttpError(res, "NOT_FOUND", 404);
    if (note.signed) return handleHttpError(res, "ALREADY_SIGNED", 400);

    const result = await uploadToPinata(fileBuffer, fileName);
    const imageUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${result.IpfsHash}`;

    note.signed = true;
    note.signatureUrl = imageUrl;
    await note.save();

    res.send(note);
  } catch (err) {
    handleHttpError(res, "ERROR_SIGN_DELIVERYNOTE");
  }
};

const deleteDeliveryNote = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const note = await deliverynotesModel.findById(id);

    if (!note) return handleHttpError(res, "DELIVERYNOTE_NOT_FOUND", 404);
    if (note.signed)
      return handleHttpError(res, "CANNOT_DELETE_SIGNED_NOTE", 403);

    const data = await deliverynotesModel.delete({ _id: id });
    res.send(data);
  } catch (err) {
    handleHttpError(res, "ERROR_DELETE_DELIVERYNOTE");
  }
};

module.exports = {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  generatePdf,
  signDeliveryNote,
  deleteDeliveryNote,
};
