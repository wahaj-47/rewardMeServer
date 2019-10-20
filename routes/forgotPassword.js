var express = require("express");
var router = express.Router();

var md5 = require("md5");
var nodemailer = require("nodemailer");
const SMTPConnection = require("nodemailer/lib/smtp-connection");

var mysql = require("mysql");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme"
});

router.post("/", function(req, res, next) {
	var user = {
		email: req.body.email
	};
	connection.query(`Select * from users where email="${user.email}"`, function(
		err,
		results,
		fields
	) {
		if (err) {
			res.send({
				error: err.code,
				msg: err.sqlMessage,
				sql: err.sql
			});
		} else if (results.length > 0) {
			sendEmail(user.email);
		} else {
			res.send({
				loggedIn: false,
				msg: "Incorrect email or password"
			});
		}
	});
});

async function sendEmail(email) {
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		auth: {
			user: "michale.kshlerin70@ethereal.email", // generated ethereal user
			pass: "YEA5Bzgp6ffDvdvV1D" // generated ethereal password
		}
	});

	transporter.verify(function(error, success) {
		if (error) {
			console.log(error);
		} else {
			console.log("Server is ready to take our messages");
		}
	});
}

module.exports = router;
