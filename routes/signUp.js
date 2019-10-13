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
		hash: md5(req.body.password),
		token: md5(req.body.email)
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
		} else
			res.send({
				msg: "User Registered Successfully"
			});
	});
});

module.exports = router;
