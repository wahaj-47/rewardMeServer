var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var logsRouter = require("./routes/logs");
var signUpRouter = require("./routes/signUp");
var loginRouter = require("./routes/login");
var slotsRouter = require("./routes/slots");
var adminRouter = require("./routes/admin");
var forgotPasswordRouter = require("./routes/forgotPassword");
var deviceTokenRouter = require("./routes/deviceToken");
var noticeRouter = require("./routes/notice");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/rewardMe/users", usersRouter);
app.use("/rewardMe/logs", logsRouter);
app.use("/rewardMe/signUp", signUpRouter);
app.use("/rewardMe/login", loginRouter);
app.use("/rewardMe/slots", slotsRouter);
app.use("/rewardMe/admin", adminRouter);
app.use("/rewardMe/forgotPassword", forgotPasswordRouter);
app.use("/rewardMe/deviceToken", deviceTokenRouter);
app.use("/rewardMe/notice", noticeRouter);

module.exports = app;
