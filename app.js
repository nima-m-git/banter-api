var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const passport = require("passport");

const bodyParser = require("body-parser");

require("dotenv").config();
require("./passport");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// Set up mongoose connection
const mongoose = require("mongoose");
const mongoDB = process.env.MONGODB_URI || process.env.DEV_DB;

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.use("/", indexRouter);
// Middleware requiring login for any further routes
app.use(passport.authenticate("jwt", { session: false, failWithError: true }));

// app.use((req, res, next) => {
//   if (req.user) return next();
//   else res.status(307).send({ msg: "login required" });
// });
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  return res.json({ err: err.toString() });
});

module.exports = app;
