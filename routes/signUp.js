var express = require("express");
var router = express.Router();
var md5 = require("md5");
var mysql = require("mysql");

var email = require("emailjs");
var randomstring = require("randomstring");

var connectionObject = require("./connection");
var connection = mysql.createConnection(connectionObject.development);

router.post("/", function(req, res, next) {
	var verificationCode = randomstring.generate({
		length: 6,
		capitalization: "uppercase"
	});
	// sendEmail(user.email);
	var user = {
		name: req.body.name,
		email: req.body.email,
		hash: md5(req.body.password),
		verificationCode
	};
	connection.query("Insert into users set ? ", user, function(
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
			var server = email.server.connect({
				user: "no-reply@mercedeshairdressing.com",
				password: "mercedeshairdressing",
				host: "server269.web-hosting.com",
				port: 587,
				tls: true
			});

			var message = {
				text: "Your email verification code is: " + verificationCode,
				from: "Mercedes Hairdressing <no-reply@mercedeshairdressing.com>",
				to: user.email,
				subject: "Email Verification"
			};

			// send the message and get a callback with an error or details of the message that was sent
			server.send(message, function(err, message) {
				console.log(err || message);
			});
			res.send({
				msg: "User Registered Successfully",
				success: true
			});
		}
	});
});

router.post("/checkExisting", function(req, res) {
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
				msg: err.sqlMessage
			});
		} else {
			if (results.length < 1) {
				res.send({
					isEmailValid: true,
					msg: "Email Valid"
				});
			} else {
				res.send({
					isEmailValid: false,
					msg: "Email already in use"
				});
			}
		}
	});
});

router.post("/verifyEmail", function(req, res) {
	var user = {
		email: req.body.email,
		verificationCode: req.body.verificationCode
	};
	console.log(user);
	connection.query(
		`Select * from users where email="${user.email}" && verificationCode="${user.verificationCode}"`,
		function(err, results, fields) {
			if (err) {
				res.send({
					error: err.code,
					msg: err.sqlMessage
				});
			} else {
				if (results.length > 0) {
					connection.query(
						`Update users set verified=1 where email="${user.email}" && verificationCode="${user.verificationCode}"`
					);
					res.send({
						emailVerified: true,
						msg: "Email Verified"
					});
				} else {
					res.send({
						emailVerified: false,
						msg: "Incorrect Verification Code"
					});
				}
			}
		}
	);
});

router.post("/sendVerificationEmail", function(req, res) {
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
				msg: err.sqlMessage
			});
		} else {
			if (results.length > 0) {
				var verificationCode = randomstring.generate({
					length: 6,
					capitalization: "uppercase"
				});

				connection.query(
					`Update users set verificationCode="${verificationCode}" where email="${user.email}"`
				);

				var server = email.server.connect({
					user: "no-reply@mercedeshairdressing.com",
					password: "mercedeshairdressing",
					host: "server269.web-hosting.com",
					port: 587,
					tls: true
				});

				var message = {
					text: "Your email verification code is: " + verificationCode,
					from: "Mercedes Hairdressing <no-reply@mercedeshairdressing.com>",
					to: user.email,
					subject: "Email Verification"
				};

				// send the message and get a callback with an error or details of the message that was sent
				server.send(message, function(err, message) {
					console.log(err || message);
				});

				res.send({
					emailSent: true
				});
			} else {
				res.send({
					emailSent: false
				});
			}
		}
	});
});

module.exports = router;
