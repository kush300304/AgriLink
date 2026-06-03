const {
  getReferencePrice,
  estimateFairPrice,
  normalizeCrop,
  supportedCrops,
  LOGISTICS_RATE_PER_KM,
} = require("../backend/utils/pricing");

describe("pricing.normalizeCrop", () => {
  it("matches crops case-insensitively", () => {
    expect(normalizeCrop("wheat")).toBe("Wheat");
    expect(normalizeCrop("  RICE ")).toBe("Rice");
  });

  it("maps the 'Sugarcan' alias to 'Sugarcane'", () => {
    expect(normalizeCrop("Sugarcan")).toBe("Sugarcane");
  });

  it("returns null for unknown or invalid crops", () => {
    expect(normalizeCrop("Banana")).toBeNull();
    expect(normalizeCrop("")).toBeNull();
    expect(normalizeCrop(undefined)).toBeNull();
  });
});

describe("pricing.getReferencePrice", () => {
  it("returns the reference floor for a known crop", () => {
    expect(getReferencePrice("Wheat")).toBe(2275);
  });

  it("returns null for an unknown crop", () => {
    expect(getReferencePrice("Mango")).toBeNull();
  });
});

describe("pricing.estimateFairPrice", () => {
  it("returns null for an unknown crop", () => {
    expect(estimateFairPrice({ crop: "Mango" })).toBeNull();
  });

  it("computes a floor with zero logistics at zero distance", () => {
    const est = estimateFairPrice({
      crop: "Wheat",
      quantity: 1,
      distanceKm: 0,
    });
    expect(est.farmerFloorPerQuintal).toBe(2275);
    expect(est.logisticsPerQuintal).toBe(0);
    expect(est.buyerLandedPerQuintal).toBe(2275);
  });

  it("adds distance-based logistics to the buyer's landed price", () => {
    const distanceKm = 58;
    const est = estimateFairPrice({ crop: "Wheat", quantity: 10, distanceKm });
    const expectedLogistics = distanceKm * LOGISTICS_RATE_PER_KM;
    expect(est.logisticsPerQuintal).toBe(expectedLogistics);
    expect(est.buyerLandedPerQuintal).toBe(2275 + expectedLogistics);
    expect(est.buyerLandedTotal).toBe((2275 + expectedLogistics) * 10);
    expect(est.farmerFloorTotal).toBe(2275 * 10);
  });

  it("defaults quantity to 1 and distance to 0 for invalid values", () => {
    const est = estimateFairPrice({
      crop: "Rice",
      quantity: -5,
      distanceKm: -1,
    });
    expect(est.quantity).toBe(1);
    expect(est.distanceKm).toBe(0);
  });
});

describe("pricing.supportedCrops", () => {
  it("includes the core crops used by AgriLink", () => {
    const crops = supportedCrops();
    ["Rice", "Wheat", "Maize", "Pulse", "Sugarcane"].forEach((crop) => {
      expect(crops).toContain(crop);
    });
  });
});
