var express = require("express");
var router = express.Router();

var md5 = require("md5");
var jwt = require("jsonwebtoken");

var email = require("emailjs");
var randomstring = require("randomstring");

var mysql = require("mysql");

var connectionObject = require("./connection");
var connection = mysql.createConnection(connectionObject.development);

router.post("/", function(req, res, next) {
	var user = {
		name: req.body.name,
		email: req.body.email,
		hash: md5(req.body.password)
	};
	connection.query("Insert into admin set ? ", user, function(
		err,
		results,
		fields
	) {
		if (err) {
			res.send({
				error: err.code,
				msg: err.sqlMessage
			});
		} else {
			res.send({
				msg: "Admin Registered Successfully"
			});
		}
	});
});

router.post("/login", function(req, res, next) {
	var user = {
		email: req.body.email,
		hash: md5(req.body.password)
	};
	connection.query(
		`Select * from admin where email="${user.email}" && hash="${user.hash}"`,
		function(err, results, fields) {
			if (err) {
				res.send({
					error: err.code,
					msg: err.sqlMessage,
					sql: err.sql
				});
			} else if (results.length > 0) {
				jwt.sign({ user }, "secretkey", (err, token) => {
					res.send({
						loginSuccess: true,
						token,
						msg: "Admin Logged in Successfully"
					});
				});
			} else {
				res.send({
					loginSuccess: false,
					msg: "Incorrect email or password"
				});
			}
		}
	);
});

router.post("/reset", function(req, res, next) {
	var user = {
		email: req.body.email
	};
	connection.query(`Select * from admin where email="${user.email}"`, function(
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
			var verificationCode = randomstring.generate({
				length: 6,
				capitalization: "uppercase"
			});
			connection.query(
				`Update admin set verificationCode="${verificationCode}" where email="${user.email}"`
			);
			// sendEmail(user.email);
			var server = email.server.connect({
				user: "no-reply@mercedeshairdressing.com",
				password: "mercedeshairdressing",
				host: "server269.web-hosting.com",
				port: 587,
				tls: true
			});

			var message = {
				text: "Your password reset code is: " + verificationCode,
				from: "Mercedes Hairdressing <no-reply@mercedeshairdressing.com>",
				to: user.email,
				subject: "Reset Password"
			};

			// send the message and get a callback with an error or details of the message that was sent
			server.send(message, function(err, message) {
				console.log(err || message);
			});
			res.send({
				emailSent: true,
				msg: "Email sent"
			});
		} else {
			res.send({
				emailSent: false,
				msg: "Email not registered"
			});
		}
	});
});

router.post("/updatePassword", function(req, res) {
	var user = {
		email: req.body.email,
		password: md5(req.body.password),
		verificationCode: req.body.verificationCode
	};
	console.log(user);
	connection.query(
		`Select * from admin where email="${user.email}" && verificationCode="${user.verificationCode}"`,
		function(err, results, fields) {
			if (err) {
				res.send({
					error: err.code,
					msg: err.sqlMessage
				});
			} else {
				if (results.length > 0) {
					connection.query(
						`Update admin set hash="${user.password}" where email="${user.email}" && verificationCode="${user.verificationCode}"`
					);
					res.send({
						passwordUpdated: true
					});
				} else {
					res.send({
						passwordUpdated: false
					});
				}
			}
		}
	);
});

module.exports = router;
