const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app");
const User = require("../models/User");
const Client = require("../models/Client");
const { tokenSign } = require("../utils/handleJwt");

describe("Client API - CRUD Completo", () => {
  let token = "";
  let clientId = "";

  beforeAll(async () => {
    await mongoose.connection.dropDatabase();

    // Paso 1: Registrar usuario
    await request(app)
      .post("/api/user/register")
      .send({ email: "client@test.com", password: "Password123" });

    // Paso 2: Verificar y recuperar el usuario actualizado
    const user = await User.findOneAndUpdate(
      { email: "client@test.com" },
      {
        status: "verified",
        companyData: {
          name: "Empresa Test",
          cif: "B99999999",
          address: "Calle Test",
        },
      },
      { new: true }
    ).lean();

    // Paso 3: Firmar el token correctamente con el campo `id`
    const { tokenSign } = require("../utils/handleJwt");
    token = tokenSign({
      _id: user._id,
      role: user.role,
      email: user.email,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) server.close();
  });

  // Paso 3: Crear cliente
  it("should create a client", async () => {
    const res = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Prueba",
        cif: "B12345678",
        address: "Calle Cliente",
        contactEmail: "cliente@email.com",
        contactPhone: "600123456",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.client.name).toBe("Cliente Prueba");
    clientId = res.body.client._id;
  });

  // Paso 4: Editar cliente
  it("should update the client", async () => {
    const res = await request(app)
      .put(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Editado",
        cif: "B12345678",
        address: "Nueva Dirección",
        contactEmail: "nuevo@email.com",
        contactPhone: "600654321",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.client.name).toBe("Cliente Editado");
  });

  // Paso 5: Obtener cliente por ID
  it("should get the client by ID", async () => {
    const res = await request(app)
      .get(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.client.name).toBe("Cliente Editado");
  });

  // Paso 6: Listar todos los clientes
  it("should list all clients for the user or company", async () => {
    const res = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.clients.length).toBeGreaterThan(0);
  });

  // Paso 7: Archivar cliente
  it("should archive (soft delete) the client", async () => {
    const res = await request(app)
      .delete(`/api/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("archivado");
  });

  // Paso 8: Listar archivados
  it("should list archived clients", async () => {
    const res = await request(app)
      .get("/api/client/archived")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.archived.length).toBeGreaterThan(0);
  });

  // Paso 9: Restaurar cliente
  it("should restore the archived client", async () => {
    const res = await request(app)
      .put(`/api/client/restore/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("restaurado");
  });

  // Paso 10: Hard delete
  it("should delete the client permanently", async () => {
    const res = await request(app)
      .delete(`/api/client/${clientId}?soft=false`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("eliminado");
  });
});
