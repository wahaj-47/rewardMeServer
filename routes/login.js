var express = require("express");
var router = express.Router();

var md5 = require("md5");
var jwt = require("jsonwebtoken");

var mysql = require("mysql");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme"
});

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
				jwt.sign({ user }, "secretkey", (err, token) => {
					res.send({
						token,
						msg: "User Logged in Successfully"
					});
				});
			} else {
				res.send({
					msg: "Incorrect email or password"
				});
			}
		}
	);
});

module.exports = router;
