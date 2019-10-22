var express = require("express");
var email = require("emailjs");
var router = express.Router();

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
			// sendEmail(user.email);
			var server = email.server.connect({
				user: "michale.kshlerin70@ethereal.email",
				password: "YEA5Bzgp6ffDvdvV1D",
				host: "smtp.ethereal.email",
				tls: { ciphers: "SSLv3" }
			});

			var message = {
				text: "i hope this works",
				from: "you <wahajhssn@gmail.com>",
				to: "someone <wahajhssn@gmail.com>",
				subject: "testing emailjs",
				attachment: [
					{ data: "<html>i <i>hope</i> this works!</html>", alternative: true }
				]
			};

			// send the message and get a callback with an error or details of the message that was sent
			server.send(message, function(err, message) {
				console.log(err || message);
			});
			res.send({
				loggedIn: false,
				msg: "Email sent"
			});
		} else {
			res.send({
				loggedIn: false,
				msg: "Email not registered"
			});
		}
	});
});

module.exports = router;
