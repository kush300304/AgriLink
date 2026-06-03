const express = require("express");
const router = express.Router();

const { registerCompany, loginCompany } = require("../controllers/company");

router.route("/company/register").post(registerCompany);
router.route("/company/login").post(loginCompany);

module.exports = router;
