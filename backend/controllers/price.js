const catchAsyncError = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { estimateFairPrice, supportedCrops } = require("../utils/pricing");

// Fair price estimate        => GET /api/v1/price?crop=Wheat&quantity=10&distanceKm=58
exports.getFairPrice = catchAsyncError(async (req, res, next) => {
  const { crop, quantity, distanceKm } = req.query;
  const estimate = estimateFairPrice({
    crop,
    quantity: quantity !== undefined ? Number(quantity) : undefined,
    distanceKm: distanceKm !== undefined ? Number(distanceKm) : undefined,
  });

  if (!estimate) {
    return next(
      new ErrorHandler(
        `Unknown crop "${crop}". Supported crops: ${supportedCrops().join(", ")}`,
        400
      )
    );
  }

  res.status(200).json({ success: true, estimate });
});
