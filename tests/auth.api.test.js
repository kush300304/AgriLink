const request = require("supertest");
const app = require("../app");
const Farmer = require("../backend/models/farmer");

const farmerPayload = {
  firstName: "Ravi",
  lastName: "Kumar",
  dob: "1990-01-01",
  contactNo: "9876543210",
  email: "ravi@example.com",
  aadhar: "123456789012",
  land: 5,
  Address: "Kotkasim, Alwar",
  password: "secret123",
  crops: ["Wheat", "Rice"],
  orders: [],
};

const companyPayload = {
  firstName: "Aman",
  lastName: "Shah",
  companyName: "FreshFoods",
  contactNo: "9999999999",
  email: "aman@freshfoods.com",
  address: "Delhi",
  gst: "22AAAAA0000A1Z5",
  password: "secret123",
  orders: [],
};

describe("Farmer auth API", () => {
  it("registers a farmer, sets an auth cookie, and hashes the password", async () => {
    const res = await request(app)
      .post("/api/v1/farmer/register")
      .send(farmerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe("farmer");
    expect(res.body.token).toBeDefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    // Password must never be returned in the response body.
    expect(res.body.user.password).toBeUndefined();

    // Password is stored hashed, not in plain text.
    const stored = await Farmer.findOne({ email: farmerPayload.email }).select(
      "+password"
    );
    expect(stored.password).not.toBe(farmerPayload.password);
  });

  it("logs a farmer in with valid credentials", async () => {
    await request(app).post("/api/v1/farmer/register").send(farmerPayload);

    const res = await request(app)
      .post("/api/v1/farmer/login")
      .send({ email: farmerPayload.email, password: farmerPayload.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
  });

  it("rejects login with a wrong password", async () => {
    await request(app).post("/api/v1/farmer/register").send(farmerPayload);

    const res = await request(app)
      .post("/api/v1/farmer/login")
      .send({ email: farmerPayload.email, password: "wrongpass" });

    expect(res.status).toBe(401);
  });

  it("rejects login when no identifier is provided", async () => {
    const res = await request(app)
      .post("/api/v1/farmer/login")
      .send({ password: "secret123" });

    expect(res.status).toBe(400);
  });
});

describe("Company auth API", () => {
  it("registers a company and returns a company-role token", async () => {
    const res = await request(app)
      .post("/api/v1/company/register")
      .send(companyPayload);

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("company");
    expect(res.body.user.password).toBeUndefined();
  });

  it("logs a company in with valid credentials", async () => {
    await request(app).post("/api/v1/company/register").send(companyPayload);

    const res = await request(app)
      .post("/api/v1/company/login")
      .send({ email: companyPayload.email, password: companyPayload.password });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("company");
  });
});
