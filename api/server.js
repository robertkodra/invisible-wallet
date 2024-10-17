require("dotenv").config();

const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");
const port = process.env.PORT || 5050;

const server = http.createServer(app);

// connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    server.listen(port, () => {
      console.log("connected to db & listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = server;
