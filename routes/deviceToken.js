var express = require("express");
var router = express.Router();

var mysql = require("mysql");
var jwt = require("jsonwebtoken");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme"
});

router.get("/all", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				"Select device_tokens.device_token, users.name, users.email from device_tokens, users where device_tokens.user_id=users.user_id",
				(err, results, fields) => {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send(results);
					}
				}
			);
		}
	});
});

router.post("/insert", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Insert into device_tokens (user_id, device_token) values ((Select user_id from users where email="${authData.user.email}"), "${req.body.deviceToken}")`,
				(err, results, fields) => {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({
							results
						});
					}
				}
			);
		}
	});
});

router.post("/update", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Update device_tokens set device_token="${req.body.deviceToken}" where user_id=(Select user_id from users where email="${authData.user.email}")`,
				(err, results, fields) => {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({
							results
						});
					}
				}
			);
		}
	});
});

router.get("/", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Select * from device_tokens where user_id=(Select user_id from users where email="${authData.user.email}")`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({
							devices: results
						});
					}
				}
			);
		}
	});
});

function verifyToken(req, res, next) {
	const bearerHeader = req.headers["authorization"];
	if (typeof bearerHeader !== "undefined") {
		const bearerToken = bearerHeader.split(" ")[1];
		req.token = bearerToken;
		next();
	} else {
		res.send({
			status: 403,
			message: "Forbidden"
		});
	}
}

module.exports = router;
