const catchAsyncError = require("../middlewares/catchAsyncErrors");
const companyService = require("../services/companyService");
const { sendToken, ROLES } = require("../utils/auth");

// Register company           => POST /api/v1/company/register
exports.registerCompany = catchAsyncError(async (req, res) => {
  const user = await companyService.registerCompany(req.body);
  sendToken(user, ROLES.COMPANY, 201, res);
});

// Login company              => POST /api/v1/company/login
exports.loginCompany = catchAsyncError(async (req, res) => {
  const user = await companyService.loginCompany(req.body);
  sendToken(user, ROLES.COMPANY, 200, res);
});
