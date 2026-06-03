const request = require("supertest");
const app = require("../app");

async function seedFarmer(overrides = {}) {
  const base = {
    firstName: "Test",
    lastName: "Farmer",
    dob: "1990-01-01",
    contactNo: String(9000000000 + Math.floor(Math.random() * 999999999)),
    email: `farmer${Math.random().toString(36).slice(2)}@example.com`,
    aadhar: String(100000000000 + Math.floor(Math.random() * 899999999999)),
    land: 5,
    Address: "Kotkasim, Alwar",
    password: "secret123",
    crops: ["Wheat"],
    orders: [],
  };
  return request(app)
    .post("/api/v1/farmer/register")
    .send({ ...base, ...overrides });
}

describe("GET /api/v1/farmer", () => {
  it("returns all farmers when no filter is given", async () => {
    await seedFarmer({ crops: ["Wheat"] });
    await seedFarmer({ crops: ["Rice"] });

    const res = await request(app).get("/api/v1/farmer");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.farmers.length).toBe(2);
  });

  it("filters farmers by crop keyword", async () => {
    await seedFarmer({ crops: ["Wheat"] });
    await seedFarmer({ crops: ["Rice"] });

    const res = await request(app).get("/api/v1/farmer?keyword=Rice");
    expect(res.status).toBe(200);
    expect(res.body.farmers.length).toBe(1);
    expect(res.body.farmers[0].crops).toContain("Rice");
  });

  it("filters farmers by minimum land area", async () => {
    await seedFarmer({ land: 2 });
    await seedFarmer({ land: 10 });

    const res = await request(app).get("/api/v1/farmer?land[gte]=5");
    expect(res.status).toBe(200);
    expect(res.body.farmers.length).toBe(1);
    expect(res.body.farmers[0].land).toBe(10);
  });
});

describe("PATCH /api/v1/farmer/order/:id (protected)", () => {
  it("rejects unauthenticated order requests", async () => {
    const reg = await seedFarmer();
    const farmerId = reg.body.user._id;

    const res = await request(app)
      .patch(`/api/v1/farmer/order/${farmerId}`)
      .send({ company: "X", reqArea: 1, crops: "Wheat", amount: 100 });

    expect(res.status).toBe(401);
  });

  it("allows a logged-in company to place an order", async () => {
    const reg = await seedFarmer();
    const farmerId = reg.body.user._id;

    const companyRes = await request(app)
      .post("/api/v1/company/register")
      .send({
        firstName: "Aman",
        lastName: "Shah",
        companyName: "FreshFoods",
        contactNo: "9999999999",
        email: "aman@freshfoods.com",
        address: "Delhi",
        gst: "22AAAAA0000A1Z5",
        password: "secret123",
        orders: [],
      });
    const cookie = companyRes.headers["set-cookie"];

    const res = await request(app)
      .patch(`/api/v1/farmer/order/${farmerId}`)
      .set("Cookie", cookie)
      .send({
        company: "FreshFoods",
        reqArea: 2,
        crops: "Wheat",
        amount: 5000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
