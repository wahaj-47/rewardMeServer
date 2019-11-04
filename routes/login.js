var express = require("express");
var router = express.Router();

var md5 = require("md5");
var jwt = require("jsonwebtoken");

var mysql = require("mysql");

var connectionObject = require("./connection");
var connection = mysql.createConnection(connectionObject.development);

router.post("/", function(req, res, next) {
	var user = {
		email: req.body.email,
		hash: md5(req.body.password)
	};
	connection.query(
		`Select * from users where email="${user.email}" && hash="${user.hash}"`,
		function(err, results, fields) {
			if (err) {
				res.send({
					error: err.code,
					msg: err.sqlMessage,
					sql: err.sql
				});
			} else if (results.length > 0) {
				if (results[0].verified) {
					console.log("verified user found");
					jwt.sign({ user }, "secretkey", (err, token) => {
						res.send({
							name: results[0].name,
							isVerified: true,
							loggedIn: true,
							token,
							msg: "User Logged in Successfully"
						});
					});
				} else {
					console.log("unverified user found");
					res.send({
						loggedIn: false,
						isVerified: false
					});
				}
			} else {
				console.log("incorrect email or password");
				res.send({
					loggedIn: false,
					msg: "Incorrect email or password"
				});
			}
		}
	);
});

module.exports = router;
