const catchAsyncError = require("../middlewares/catchAsyncErrors");
const farmerService = require("../services/farmerService");
const { sendToken, ROLES } = require("../utils/auth");

// Register farmer            => POST /api/v1/farmer/register
exports.registerFarmer = catchAsyncError(async (req, res) => {
  const user = await farmerService.registerFarmer(req.body);
  sendToken(user, ROLES.FARMER, 201, res);
});

// Login farmer               => POST /api/v1/farmer/login
exports.loginFarmer = catchAsyncError(async (req, res) => {
  const user = await farmerService.loginFarmer(req.body);
  sendToken(user, ROLES.FARMER, 200, res);
});

// Get all farmers            => GET /api/v1/farmer?keyword=Wheat&land[gte]=2
exports.getfarmers = catchAsyncError(async (req, res) => {
  const farmers = await farmerService.getFarmers(req.query);
  res.status(200).json({
    success: true,
    farmers,
  });
});

// Add an order to a farmer   => PATCH /api/v1/farmer/order/:id
exports.getOrder = catchAsyncError(async (req, res) => {
  await farmerService.addOrder(req.params.id, req.body);
  res.status(200).json({
    success: true,
  });
});
