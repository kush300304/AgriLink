const Farmer = require("../models/farmer");
const ErrorHandler = require("../utils/errorHandler");
const ApiFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");

// Resister farmer           => /api/v1/farmer/register
exports.registerFarmer = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    dob,
    contactNo,
    email,
    aadhar,
    land,
    Address,
    password,
    crops,
    orders,
  } = req.body;
  console.log(req.body)
  const user = await Farmer.create({
    firstName,
    lastName,
    dob,
    contactNo,
    email,
    aadhar,
    land,
    Address,
    password,
    crops,
    orders,
  });
  sendToken(user, 201, res);
});

// Login Farmer        => /api/v1/farmer/login
exports.loginFarmer = catchAsyncError(async (req, res, next) => {
  const { email, password, contactNo } = req.body;
  if (!password) {
    return next(new ErrorHandler("Please enter a password", 400));
  }
  let user;
  if (email || contactNo) {
    if (email) {
      // Finding user in database
      user = await Farmer.findOne({ email }).select("+password");
    } else {
      // Finding user in database
      user = await Farmer.findOne({ contactNo }).select("+password");
    }
  } else {
    return next(
      new ErrorHandler("Please enter a email or contact number", 400)
    );
  }
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }
  // check password is correct or not
  const isPasswordMattched = await user.comparePassword(password);
  if (!isPasswordMattched) {
    return next(new ErrorHandler("Incorrect Password", 401));
  }
  sendToken(user, 200, res);
});


// Get all farmers   =>    /api/v1/farmer?keywords=Wheat
exports.getfarmers = catchAsyncError(async (req, res, next) => {
  const resPerPage = 8;
  const apiFeatures = new ApiFeatures(Farmer.find(), req.query)
    .search() //all the products in Product collection is now stored in apifeaturs
    .filter() //all the product matching with keyword is store in this
    .pagination(resPerPage); //maximum resPerPage is shown in 1 page
  const farmers = await apiFeatures.query;

  res.status(200).json({
    sucess: true,
    farmers,
  });
});

// Get order         =>   /api/v1/farmer/order/:id
exports.getOrder = catchAsyncError(async (req, res, next) => {
  
  const farmer = await Farmer.findById(req.params.id);
  if (!farmer) {
    return next(new ErrorHandler("Farmer not found", 404));
  }
  const newOreder = req.body;
 
  farmer.orders.push(newOreder)
  farmer.save();
  res.status(200).json({
    success: true,
  });
}) 