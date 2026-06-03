const ErrorHandler = require("../utils/errorHandler");

// Centralized error handler. Always sends a response (previously it only
// responded in DEVELOPMENT/PRODUCTION, which could hang other environments).
module.exports = (err, req, res, _next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  // Wrong mongoose object Id
  if (err.name === "CastError") {
    error = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
  }

  // Mongoose validation error (e.g. a required field is missing)
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((value) => value.message);
    error = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key (e.g. registering with an existing email)
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
    error = new ErrorHandler(message, 400);
  }

  // Invalid JWT
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("JSON Web Token is invalid. Try again.", 401);
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler("JSON Web Token has expired. Try again.", 401);
  }

  const body = {
    success: false,
    message: error.message,
  };

  // Extra detail while developing.
  if (process.env.NODE_ENV === "DEVELOPMENT") {
    body.error = err;
    body.stack = err.stack;
  }

  res.status(error.statusCode).json(body);
};
