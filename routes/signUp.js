var express = require("express");
var router = express.Router();

var md5 = require("md5");

var mysql = require("mysql");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme"
});

router.post("/", function(req, res, next) {
	var user = {
		name: req.body.name,
		email: req.body.email,
		hash: md5(req.body.password)
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
			res.send({
				msg: "User Registered Successfully"
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

module.exports = router;
