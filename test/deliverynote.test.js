const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { app, server } = require("../app");
const User = require("../models/User");
const { tokenSign } = require("../utils/handleJwt");

describe("DeliveryNote API - Flujo completo", () => {
  let token = "";
  let noteId = "";
  let clientId = "";
  let projectId = "";

  // Paso 1: Preparar usuario, token, cliente y proyecto
  beforeAll(async () => {
    await mongoose.connection.dropDatabase();

    await request(app)
      .post("/api/user/register")
      .send({ email: "note@test.com", password: "Password123" });

    const user = await User.findOneAndUpdate(
      { email: "note@test.com" },
      {
        status: "verified",
        companyData: {
          name: "Empresa Test",
          cif: "B44444444",
          address: "Calle 44",
        },
      },
      { new: true }
    ).lean();

    token = await tokenSign({
      _id: user._id,
      email: user.email,
      role: user.role,
    });

    const clientRes = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Albarán",
        cif: "B00000000",
        address: "Calle Cliente",
        contactEmail: "cliente@note.com",
        contactPhone: "611000000",
      });

    clientId = clientRes.body.client._id;

    const projectRes = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Proyecto Albarán",
        description: "Proyecto para test de albaranes",
        client: clientId,
        startDate: "2024-04-01",
        endDate: "2024-12-31",
      });

    projectId = projectRes.body.project._id;
  });

  // Paso 2: Cerrar conexión
  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) server.close();
  });

  // Paso 3: Crear albarán
  it("should create a delivery note", async () => {
    const res = await request(app)
      .post("/api/deliverynote")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "horas",
        clientId,
        projectId,
        entries: [
          {
            name: "Técnico A",
            quantity: 4,
            unit: "horas",
            description: "Mantenimiento",
          },
        ],
      });

    expect(res.statusCode).toBe(200);
    noteId = res.body._id;
  });

  // Paso 4: Listar albaranes
  it("should list all delivery notes", async () => {
    const res = await request(app)
      .get("/api/deliverynote")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Paso 5: Obtener albarán por ID
  it("should get a delivery note by ID", async () => {
    const res = await request(app)
      .get(`/api/deliverynote/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(noteId);
  });

  // Paso 6: Generar PDF del albarán
  it("should generate a PDF for the delivery note", async () => {
    const res = await request(app)
      .get(`/api/deliverynote/pdf/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  // Paso 7: Firmar el albarán
  it("should sign the delivery note", async () => {
    const image = fs.readFileSync(path.join(__dirname, "firma.png"));

    const res = await request(app)
      .patch(`/api/deliverynote/sign/${noteId}`)
      .set("Authorization", `Bearer ${token}`)
      .attach("image", image, "firma.png");

    expect(res.statusCode).toBe(200);
    expect(res.body.signed).toBe(true);
    expect(res.body.signatureUrl).toContain("ipfs");
  });

  // Paso 8: No permitir borrar un albarán firmado
  it("should NOT delete the signed delivery note", async () => {
    const res = await request(app)
      .delete(`/api/deliverynote/${noteId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });
});
