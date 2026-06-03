const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const errorMiddleware = require("./backend/middlewares/error");
const { attachUser } = require("./backend/middlewares/isAuthenticated");
const { setAuthCookie, signToken, ROLES } = require("./backend/utils/auth");
const farmerService = require("./backend/services/farmerService");
const companyService = require("./backend/services/companyService");
const { estimateFairPrice } = require("./backend/utils/pricing");

// Setting up the config file early so env vars are available everywhere.
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "./backend/config/config.env" });
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views/"));

// Security headers. CSP is disabled because the EJS templates rely on inline
// scripts and several CDNs (Alpine.js, Chart.js, Google Fonts, Font Awesome).
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Distance (in km) from AgriLink's hub to known farmer locations. Used both for
// display and for the distance-based logistics part of the fair-price estimate.
const distance = {
  "Jeevan Singhpura, Alwar": 167,
  "Mohanpur Ishrana Rambas Road, Mohanpur, Rewari": 135,
  "77R4+XGV, Sarmathla, Bhanakpur, Haryana": 58,
  "2G66+CQ, Baghela, Punjab": 403,
  "Kotkasim, Alwar": 132,
};

// Make the logged-in user available to every route/view.
app.use(attachUser);

// API routes
const farmers = require("./backend/routes/farmer");
const companies = require("./backend/routes/company");
const prices = require("./backend/routes/price");

app.use("/api/v1", farmers);
app.use("/api/v1", companies);
app.use("/api/v1", prices);

// ---------------------------------------------------------------------------
// View-context helpers
// ---------------------------------------------------------------------------
function companyDashboardContext(company, extra = {}) {
  return {
    firstName: company.firstName,
    lastName: company.lastName,
    companyName: company.companyName,
    email: company.email,
    address: company.address,
    gst: company.gst,
    orders: company.orders || [],
    distance,
    hasQuery: false,
    message: "",
    farmers: [],
    priceInsights: {},
    ...extra,
  };
}

function farmerDashboardContext(farmer, extra = {}) {
  return {
    firstName: farmer.firstName,
    lastName: farmer.lastName,
    email: farmer.email,
    contactNo: farmer.contactNo,
    aadhar: farmer.aadhar,
    land: farmer.land,
    Address: farmer.Address,
    crops: farmer.crops || [],
    orders: farmer.orders || [],
    ...extra,
  };
}

// Build per-farmer Fair Price Insight: a per-quintal estimate for each crop the
// farmer grows, factoring the buyer→farmer distance.
function buildPriceInsights(farmerList) {
  const insights = {};
  farmerList.forEach((farmer) => {
    const distanceKm = distance[farmer.Address] || 0;
    insights[farmer._id] = (farmer.crops || [])
      .map((crop) => estimateFairPrice({ crop, distanceKm }))
      .filter(Boolean);
  });
  return insights;
}

// ---------------------------------------------------------------------------
// Public pages
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/home", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/tandc", (req, res) => res.render("TANDC"));

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/home");
});

// ---------------------------------------------------------------------------
// Auth flows (web)
// ---------------------------------------------------------------------------
function loginCookie(res, user, role) {
  setAuthCookie(res, signToken(user._id, role));
}

app.post("/logincompany", async (req, res) => {
  try {
    const company = await companyService.loginCompany({
      email: req.body.cemail,
      contactNo: req.body.ccontactNo,
      password: req.body.cpassword,
    });
    loginCookie(res, company, ROLES.COMPANY);
    res.render("companyDashboard", companyDashboardContext(company));
  } catch (error) {
    res.status(error.statusCode || 401).render("login", {
      error: error.message || "Login failed",
    });
  }
});

app.post("/loginfarmer", async (req, res) => {
  try {
    const farmer = await farmerService.loginFarmer({
      email: req.body.email,
      contactNo: req.body.contactNo,
      password: req.body.password,
    });
    loginCookie(res, farmer, ROLES.FARMER);
    res.render("farmerDashboard", farmerDashboardContext(farmer));
  } catch (error) {
    res.status(error.statusCode || 401).render("login", {
      error: error.message || "Login failed",
    });
  }
});

app.post("/registercompany", async (req, res) => {
  try {
    const company = await companyService.registerCompany({
      firstName: req.body.cfirstName,
      lastName: req.body.clastName,
      companyName: req.body.companyName,
      contactNo: req.body.ccontactNo,
      email: req.body.cemail,
      address: req.body.caddress,
      gst: req.body.cgst,
      password: req.body.cpassword,
      orders: [],
    });
    loginCookie(res, company, ROLES.COMPANY);
    res.render("companyDashboard", companyDashboardContext(company));
  } catch (error) {
    res.status(error.statusCode || 400).render("signup", {
      error: error.message || "Registration failed",
    });
  }
});

const FARMER_CROP_FIELDS = [
  "crop1",
  "crop2",
  "crop3",
  "crop4",
  "crop5",
  "crop6",
  "crop7",
];

app.post("/registerfarmer", async (req, res) => {
  try {
    const crops = FARMER_CROP_FIELDS.map((field) => req.body[field]).filter(
      (crop) => crop && crop.trim() !== ""
    );

    const farmer = await farmerService.registerFarmer({
      firstName: req.body.fname,
      lastName: req.body.lname,
      dob: req.body.dob,
      contactNo: req.body.contactNo,
      email: req.body.email,
      aadhar: req.body.aadhar,
      land: req.body.land,
      Address: req.body.Address,
      password: req.body.password,
      crops,
      orders: [],
    });
    loginCookie(res, farmer, ROLES.FARMER);
    res.render("farmerDashboard", farmerDashboardContext(farmer));
  } catch (error) {
    res.status(error.statusCode || 400).render("signup", {
      error: error.message || "Registration failed",
    });
  }
});

// ---------------------------------------------------------------------------
// Authenticated dashboards / actions
// ---------------------------------------------------------------------------
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.userRole !== role) {
      return res.redirect("/login");
    }
    next();
  };
}

app.get("/companydash", requireRole(ROLES.COMPANY), (req, res) => {
  res.render("companyDashboard", companyDashboardContext(req.user));
});

app.get("/farmerdash", requireRole(ROLES.FARMER), (req, res) => {
  res.render("farmerDashboard", farmerDashboardContext(req.user));
});

app.post("/getfarmers", requireRole(ROLES.COMPANY), async (req, res) => {
  try {
    const land = req.body.reqLand ? Number(req.body.reqLand) : 0;
    const farmerList = await farmerService.getFarmers({
      keyword: req.body.crop || undefined,
      land: { gte: land },
    });

    res.render(
      "companyDashboard",
      companyDashboardContext(req.user, {
        hasQuery: true,
        farmers: farmerList,
        priceInsights: buildPriceInsights(farmerList),
      })
    );
  } catch (error) {
    res.render(
      "companyDashboard",
      companyDashboardContext(req.user, {
        message: error.message || "Something went wrong",
      })
    );
  }
});

app.post("/sendorder", requireRole(ROLES.COMPANY), async (req, res) => {
  try {
    const order = {
      by: req.user._id,
      company: req.user.companyName,
      reqArea: req.body.input_area,
      crops: req.body.input_crop,
      amount: req.body.input_amount,
    };

    await farmerService.addOrder(req.body.fid, order);
    await companyService.addOrder(req.user._id, {
      to: req.body.fid,
      reqArea: req.body.input_area,
      crops: req.body.input_crop,
      amount: req.body.input_amount,
    });

    const company = await companyService.findById(req.user._id);
    res.render(
      "companyDashboard",
      companyDashboardContext(company, {
        message: "Order Sent Successfully",
      })
    );
  } catch (error) {
    res.render(
      "companyDashboard",
      companyDashboardContext(req.user, {
        message: error.message || "Could not send order",
      })
    );
  }
});

// middleware to handle errors
app.use(errorMiddleware);

module.exports = app;
