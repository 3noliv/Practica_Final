const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { app, server } = require("../app");
const User = require("../models/User");
const { tokenSign } = require("../utils/handleJwt");

describe("User API - flujo completo", () => {
  let token = "";
  let userId = "";
  const testEmail = `testuser${Date.now()}@mail.com`;
  const password = "Password123";

  beforeAll(async () => {
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) server.close();
  });

  // 1. Registro y verificación manual
  it("should register a user and verify", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .send({ email: testEmail, password });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(testEmail);

    // Verificar usuario y generar token con ID
    const rawUser = await User.findOneAndUpdate(
      { email: testEmail },
      { status: "verified" },
      { new: true }
    ).lean();

    delete rawUser.password;
    userId = rawUser._id;
    token = await tokenSign({
      id: rawUser._id, // aseguramos que use `id` para el middleware
      role: rawUser.role,
      email: rawUser.email,
    });
  });

  // 2. Login
  it("should login", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: testEmail, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  // 3. Obtener perfil
  it("should get current user", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(testEmail);
  });

  // 4. Actualizar datos personales
  it("should update personal data", async () => {
    const res = await request(app)
      .put("/api/user/register")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test", surname: "User", nif: "12345678Z" });
    expect(res.statusCode).toBe(200);
  });

  // 5. Actualizar empresa
  it("should update company data", async () => {
    const res = await request(app)
      .patch("/api/user/company")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Mi Empresa", cif: "B12345678", address: "Calle 1" });
    expect(res.statusCode).toBe(200);
  });

  // 6. Subida de logo (simulado)
  it("should upload logo", async () => {
    const buffer = fs.readFileSync(path.join(__dirname, "logo.png"));

    const res = await request(app)
      .patch("/api/user/logo")
      .set("Authorization", `Bearer ${token}`)
      .attach("logo", buffer, "logo.png");

    expect(res.statusCode).toBe(200);
    expect(res.body.logoUrl).toContain("ipfs");
  });

  // 7. Cambiar contraseña
  it("should change password", async () => {
    const res = await request(app)
      .patch("/api/user/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: password,
        newPassword: "Password456",
      });
    expect(res.statusCode).toBe(200);
  });

  // 8. Recuperar contraseña
  it("should start password recovery", async () => {
    const res = await request(app)
      .post("/api/user/recover")
      .send({ email: testEmail });
    expect(res.statusCode).toBe(200);
  });

  // 9. Soft delete
  it("should soft delete user", async () => {
    const res = await request(app)
      .delete("/api/user")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  // 10. Restaurar usuario y loguearse de nuevo con la nueva contraseña
  it.skip("should restore user", async () => {
    const restoreRes = await request(app)
      .put("/api/user/restore")
      .set("Authorization", `Bearer ${token}`);

    expect(restoreRes.statusCode).toBe(200);
    await new Promise((r) => setTimeout(r, 500));

    const loginRes = await request(app)
      .post("/api/user/login")
      .send({ email: testEmail, password: "Password456" });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    token = loginRes.body.token;
  });

  // 11. Hard delete (usuario temporal)
  it("should hard delete a new user", async () => {
    const tempEmail = `tempuser${Date.now()}@mail.com`;

    const res = await request(app)
      .post("/api/user/register")
      .send({ email: tempEmail, password: "TempPassword123" });

    expect(res.statusCode).toBe(201);
    const tempToken = res.body.token;

    await User.findOneAndUpdate({ email: tempEmail }, { status: "verified" });

    const deleteRes = await request(app)
      .delete("/api/user?soft=false")
      .set("Authorization", `Bearer ${tempToken}`);

    expect(deleteRes.statusCode).toBe(200);
  });

  // 12. Invitar guest
  it("should invite a guest user", async () => {
    const res1 = await request(app)
      .post("/api/user/register")
      .send({ email: "admin@admin.com", password: "Password123" });

    const adminToken = res1.body.token;

    await User.findOneAndUpdate(
      { email: "admin@admin.com" },
      {
        status: "verified",
        companyData: {
          name: "Empresa",
          cif: "B22222222",
          address: "Avenida 2",
        },
      }
    );

    const res = await request(app)
      .post("/api/user/invite")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "guest@empresa.com" });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain("Invitación enviada");
  });
});
