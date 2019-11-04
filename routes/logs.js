var express = require("express");
var router = express.Router();

var mysql = require("mysql");
var jwt = require("jsonwebtoken");

var connectionObject = require("./connection");
var connection = mysql.createConnection(connectionObject.development);

router.post("/", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Insert into logs (value, user_id) values ((Select slot_value from slots where slot_id="${req.body.slot_id}"), (Select user_id from users where email="${authData.user.email}"))`,
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
				`Select * from logs where user_id=(Select user_id from users where email="${authData.user.email}") ORDER BY timestamp DESC`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({
							authData,
							logs: results
						});
					}
				}
			);
		}
	});
});

router.get("/clear", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Delete from logs where user_id=(Select user_id from users where email="${authData.user.email}")`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({
							logsCleared: true
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
