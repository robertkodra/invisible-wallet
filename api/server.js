const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const app = require("./app");
const mongoose = require("mongoose");

dotenv.config({
  path: path.resolve(
    __dirname,
    `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`
  ),
});

const port = process.env.PORT || 5050;

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(port, () => {
      console.log("Connected to db & listening on port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = server;
