const ErrorHandler = require("../utils/errorHandler");
const Farmer = require("../models/farmer");
const Company = require("../models/company");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const { ROLES } = require("../utils/auth");

// Load the current user from the JWT cookie. Works for both farmers and
// companies by reading the `role` claim embedded in the token.
async function resolveUserFromToken(token) {
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const model = decoded.role === ROLES.COMPANY ? Company : Farmer;
  const user = await model.findById(decoded.id);
  if (!user) return null;
  return { user, role: decoded.role };
}

// Populates req.user / req.userRole when a valid cookie is present, but never
// blocks the request. Useful for pages that render differently when logged in.
const attachUser = catchAsyncErrors(async (req, _res, next) => {
  try {
    const resolved = await resolveUserFromToken(
      req.cookies && req.cookies.token
    );
    if (resolved) {
      req.user = resolved.user;
      req.userRole = resolved.role;
    }
  } catch (err) {
    // Invalid/expired token — treat as logged out.
  }
  next();
});

// Hard guard: rejects the request unless a valid session exists.
const isAuthenticatedUser = catchAsyncErrors(async (req, _res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return next(new ErrorHandler("Login first to access this resource.", 401));
  }
  const resolved = await resolveUserFromToken(token);
  if (!resolved) {
    return next(new ErrorHandler("Login first to access this resource.", 401));
  }
  req.user = resolved.user;
  req.userRole = resolved.role;
  next();
});

// Restrict a route to specific roles.
function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(
        new ErrorHandler("You are not allowed to access this resource.", 403)
      );
    }
    next();
  };
}

module.exports = {
  isAuthenticatedUser,
  attachUser,
  authorizeRoles,
  resolveUserFromToken,
};
