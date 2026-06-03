const request = require("supertest");
const app = require("../app");

describe("GET /api/v1/price", () => {
  it("returns a fair-price estimate for a known crop", async () => {
    const res = await request(app).get(
      "/api/v1/price?crop=Wheat&quantity=10&distanceKm=58"
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.estimate.crop).toBe("Wheat");
    expect(res.body.estimate.quantity).toBe(10);
    expect(res.body.estimate.farmerFloorPerQuintal).toBe(2275);
    expect(res.body.estimate.buyerLandedPerQuintal).toBeGreaterThan(2275);
  });

  it("400s on an unknown crop", async () => {
    const res = await request(app).get("/api/v1/price?crop=Banana");
    expect(res.status).toBe(400);
  });
});
