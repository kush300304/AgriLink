const express = require("express");
const router = express.Router();

const { getFairPrice } = require("../controllers/price");

router.route("/price").get(getFairPrice);

module.exports = router;
