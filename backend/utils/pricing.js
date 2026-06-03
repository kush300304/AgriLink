/**
 * Fair Price Insight
 * ------------------
 * AgriLink's mission is to help farmers get *justified* prices. This module
 * turns that mission into a concrete, transparent number.
 *
 * For a given crop it suggests a fair floor price for the farmer based on a
 * reference table of Minimum Support Price (MSP) style values (₹ per quintal),
 * then layers on a distance-based logistics estimate so a buyer can see the
 * full landed cost before placing an order.
 *
 * The numbers are illustrative reference values, not live market data — they
 * exist to make the "fair price" idea tangible and explainable.
 */

// Reference floor prices in ₹ per quintal (1 quintal = 100 kg).
const REFERENCE_PRICES = Object.freeze({
  Rice: 2300,
  Wheat: 2275,
  Barley: 1850,
  Oats: 1900,
  Pulse: 6000,
  Maize: 2225,
  Sugarcane: 340,
});

// Some of the app's data uses the spelling "Sugarcan".
const CROP_ALIASES = Object.freeze({
  Sugarcan: "Sugarcane",
});

// Logistics estimate: ₹ per quintal, per km, between buyer and farmer.
const LOGISTICS_RATE_PER_KM = 2;

function normalizeCrop(crop) {
  if (!crop || typeof crop !== "string") return null;
  const trimmed = crop.trim();
  const canonical = CROP_ALIASES[trimmed] || trimmed;
  // Case-insensitive match against the reference table.
  const match = Object.keys(REFERENCE_PRICES).find(
    (name) => name.toLowerCase() === canonical.toLowerCase()
  );
  return match || null;
}

// Floor price (₹/quintal) a farmer should fairly receive for a crop.
function getReferencePrice(crop) {
  const name = normalizeCrop(crop);
  return name ? REFERENCE_PRICES[name] : null;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Estimate a fair price breakdown for an order.
 *
 * @param {Object} params
 * @param {string} params.crop        Crop name (e.g. "Wheat").
 * @param {number} [params.quantity]  Quantity in quintals (default 1).
 * @param {number} [params.distanceKm] Buyer→farmer distance in km (default 0).
 * @returns {Object|null} Breakdown, or null if the crop is unknown.
 */
function estimateFairPrice({ crop, quantity = 1, distanceKm = 0 } = {}) {
  const cropName = normalizeCrop(crop);
  if (!cropName) return null;

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const distance = Number(distanceKm) > 0 ? Number(distanceKm) : 0;

  const farmerFloorPerQuintal = REFERENCE_PRICES[cropName];
  const logisticsPerQuintal = round(distance * LOGISTICS_RATE_PER_KM);
  const buyerLandedPerQuintal = round(
    farmerFloorPerQuintal + logisticsPerQuintal
  );

  return {
    crop: cropName,
    quantity: qty,
    distanceKm: distance,
    currency: "INR",
    unit: "quintal",
    farmerFloorPerQuintal,
    logisticsPerQuintal,
    buyerLandedPerQuintal,
    farmerFloorTotal: round(farmerFloorPerQuintal * qty),
    logisticsTotal: round(logisticsPerQuintal * qty),
    buyerLandedTotal: round(buyerLandedPerQuintal * qty),
  };
}

// Crops that have a reference price (handy for dropdowns / docs).
function supportedCrops() {
  return Object.keys(REFERENCE_PRICES);
}

module.exports = {
  REFERENCE_PRICES,
  LOGISTICS_RATE_PER_KM,
  normalizeCrop,
  getReferencePrice,
  estimateFairPrice,
  supportedCrops,
};
