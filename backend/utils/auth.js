const jwt = require("jsonwebtoken");

// Roles encoded inside the JWT so a single cookie works for both account types.
const ROLES = Object.freeze({ FARMER: "farmer", COMPANY: "company" });

// Sign a JWT that carries both the user id and their role.
function signToken(userId, role) {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME || "7d",
  });
}

// Standard options for the auth cookie.
function cookieOptions() {
  const days = Number(process.env.COOKIE_EXPIRES_TIME) || 7;
  return {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "PRODUCTION",
  };
}

// Attach the auth cookie to a response.
function setAuthCookie(res, token) {
  res.cookie("token", token, cookieOptions());
}

// API helper: set the cookie and return a JSON body with the token + user.
function sendToken(user, role, statusCode, res) {
  const token = signToken(user._id, role);
  setAuthCookie(res, token);
  const safeUser = user.toObject ? user.toObject() : user;
  delete safeUser.password;
  res.status(statusCode).json({ success: true, token, role, user: safeUser });
}

module.exports = { ROLES, signToken, cookieOptions, setAuthCookie, sendToken };
