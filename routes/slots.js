var express = require("express");
var router = express.Router();

var mysql = require("mysql");
var jwt = require("jsonwebtoken");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme",
	multipleStatements: true
});

router.get("/reset", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Delete from revealed_slots where user_id = (Select user_id from users where email="${authData.user.email}")`,
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

router.post("/reveal", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Insert into revealed_slots (slot_id, user_id) values ("${req.body.slot_id}",(Select user_id from users where email="${authData.user.email}"));
                 Select * from slots where slot_id = "${req.body.slot_id}"`,
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

router.post("/revealed", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Select * from revealed_slots where user_id=(Select user_id from users where email="${authData.user.email}")`,
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
							slots: results
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
