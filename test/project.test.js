const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app");
const User = require("../models/User");
const { tokenSign } = require("../utils/handleJwt");

describe("Project API - CRUD Completo", () => {
  let token = "";
  let projectId = "";
  let client = "";

  // Paso 1: Preparar entorno, usuario, token y cliente
  beforeAll(async () => {
    await mongoose.connection.dropDatabase();

    await request(app)
      .post("/api/user/register")
      .send({ email: "project@test.com", password: "Password123" });

    const user = await User.findOneAndUpdate(
      { email: "project@test.com" },
      {
        status: "verified",
        companyData: {
          name: "Empresa Proyectos",
          cif: "B88888888",
          address: "Calle Empresa",
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
        name: "Cliente Proyecto",
        cif: "B33333333",
        address: "Avenida Cliente",
        contactEmail: "cliente@proyecto.com",
        contactPhone: "600112233",
      });

    client = clientRes.body.client._id;
  });

  // Paso 2: Cerrar conexión tras los tests
  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) server.close();
  });

  // Paso 3: Crear proyecto
  it("should create a project", async () => {
    const res = await request(app)
      .post("/api/project")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Proyecto Alpha",
        description: "Proyecto de prueba",
        client: client,
        startDate: "2024-04-01",
        endDate: "2024-12-31",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.project.name).toBe("Proyecto Alpha");
    projectId = res.body.project._id;
  });

  // Paso 4: Editar proyecto
  it("should update the project", async () => {
    const res = await request(app)
      .put(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Proyecto Actualizado",
        client: client,
        description: "Editado",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.project.name).toBe("Proyecto Actualizado");
  });

  // Paso 5: Obtener proyecto por ID
  it("should get the project by ID", async () => {
    const res = await request(app)
      .get(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.project._id).toBe(projectId);
  });

  // Paso 6: Listar todos los proyectos
  it("should list all projects for the user or company", async () => {
    const res = await request(app)
      .get("/api/project")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  // Paso 7: Archivar proyecto (soft delete)
  it("should archive the project", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("archivado");
  });

  // Paso 8: Listar proyectos archivados
  it("should list archived projects", async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app)
      .get("/api/project/archived")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.archived.length).toBeGreaterThan(0);
  });

  // Paso 9: Restaurar proyecto
  it("should restore the archived project", async () => {
    const res = await request(app)
      .put(`/api/project/restore/${projectId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("restaurado");
  });

  // Paso 10: Eliminar proyecto definitivamente (hard delete)
  it("should hard delete the project", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectId}?soft=false`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("eliminado");
  });
});
