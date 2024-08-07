const app = require("./app");
const connectDatabase = require("./backend/config/database");


// Handle Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shuting down the server due to Uncaught Exceptionsn");
  server.close(() => {
    process.exit(1);
  });
});

//setting up config file
if (process.env.NODE_ENV !== "PRODUCTION")
  require("dotenv").config({ path: "backend/config/config.env" });

// Connecting to database
connectDatabase();


const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});

// Handle unhaldled Promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.message}`);
  console.log("Shuting down the server due to Unhandled Promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
