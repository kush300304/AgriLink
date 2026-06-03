const Company = require("../models/company");
const ErrorHandler = require("../utils/errorHandler");

const COMPANY_FIELDS = [
  "firstName",
  "lastName",
  "contactNo",
  "companyName",
  "email",
  "address",
  "gst",
  "password",
  "orders",
];

function pick(source, fields) {
  return fields.reduce((acc, field) => {
    if (source[field] !== undefined) acc[field] = source[field];
    return acc;
  }, {});
}

// Create a new company (buyer) account.
async function registerCompany(data) {
  const payload = pick(data, COMPANY_FIELDS);
  return Company.create(payload);
}

// Authenticate a company by email or contact number + password.
async function loginCompany({ email, contactNo, password }) {
  if (!password) {
    throw new ErrorHandler("Please enter a password", 400);
  }
  if (!email && !contactNo) {
    throw new ErrorHandler("Please enter an email or contact number", 400);
  }

  const query = email ? { email } : { contactNo };
  const company = await Company.findOne(query).select("+password");
  if (!company) {
    throw new ErrorHandler("Invalid email or password", 401);
  }

  const isMatch = await company.comparePassword(password);
  if (!isMatch) {
    throw new ErrorHandler("Invalid email or password", 401);
  }
  return company;
}

// Record an order the company has placed.
async function addOrder(companyId, order) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw new ErrorHandler("Company not found", 404);
  }
  company.orders.push(order);
  await company.save();
  return company;
}

function findById(id) {
  return Company.findById(id);
}

module.exports = {
  registerCompany,
  loginCompany,
  addOrder,
  findById,
};
