const { MongoMemoryServer } = require("mongodb-memory-server");

// Spin up a single in-memory MongoDB for the whole test run and expose its URI
// to the test workers via env vars. No external database is required.
module.exports = async () => {
  const instance = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = instance;

  process.env.DB_URI = instance.getUri();
  process.env.NODE_ENV = "TEST";
  process.env.JWT_SECRET = "test_secret_do_not_use_in_prod";
  process.env.JWT_EXPIRES_TIME = "1h";
  process.env.COOKIE_EXPIRES_TIME = "1";
};
