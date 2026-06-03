const Farmer = require("../models/farmer");
const ErrorHandler = require("../utils/errorHandler");
const ApiFeatures = require("../utils/apiFeatures");

const FARMER_FIELDS = [
  "firstName",
  "lastName",
  "dob",
  "contactNo",
  "email",
  "aadhar",
  "land",
  "Address",
  "password",
  "crops",
  "orders",
];

function pick(source, fields) {
  return fields.reduce((acc, field) => {
    if (source[field] !== undefined) acc[field] = source[field];
    return acc;
  }, {});
}

// Create a new farmer account.
async function registerFarmer(data) {
  const payload = pick(data, FARMER_FIELDS);
  return Farmer.create(payload);
}

// Authenticate a farmer by email or contact number + password.
async function loginFarmer({ email, contactNo, password }) {
  if (!password) {
    throw new ErrorHandler("Please enter a password", 400);
  }
  if (!email && !contactNo) {
    throw new ErrorHandler("Please enter an email or contact number", 400);
  }

  const query = email ? { email } : { contactNo };
  const farmer = await Farmer.findOne(query).select("+password");
  if (!farmer) {
    throw new ErrorHandler("Invalid email or password", 401);
  }

  const isMatch = await farmer.comparePassword(password);
  if (!isMatch) {
    throw new ErrorHandler("Invalid email or password", 401);
  }
  return farmer;
}

// Search / filter / paginate farmers (used by buyers looking for produce).
async function getFarmers(queryParams = {}) {
  const resPerPage = 8;
  const features = new ApiFeatures(Farmer.find(), queryParams)
    .search()
    .filter()
    .pagination(resPerPage);
  return features.query;
}

// Append an order to a farmer's order list.
async function addOrder(farmerId, order) {
  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    throw new ErrorHandler("Farmer not found", 404);
  }
  farmer.orders.push(order);
  await farmer.save();
  return farmer;
}

function findById(id) {
  return Farmer.findById(id);
}

module.exports = {
  registerFarmer,
  loginFarmer,
  getFarmers,
  addOrder,
  findById,
};
