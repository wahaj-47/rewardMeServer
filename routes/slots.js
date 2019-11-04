var express = require("express");
var router = express.Router();

var mysql = require("mysql");
var jwt = require("jsonwebtoken");

var connectionObject = require("./connection");
var connection = mysql.createConnection({
	...connectionObject.development,
	multipleStatements: true
});

router.post("/", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query("Select * from slots", (err, results, fields) => {
				if (err) {
					res.send({
						error: err.code,
						msg: err.sqlMessage,
						sql: err.sql
					});
				} else {
					res.send({ results });
				}
			});
		}
	});
});

router.post("/editSlot", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`UPDATE slots SET slot_value = "${req.body.slot_value}" WHERE slots.slot_id = "${req.body.slot_id}"`,
				(err, results, fields) => {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						res.send({ results, slotEdited: true });
					}
				}
			);
		}
	});
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
				`Insert into revealed_slots (slot_id, slot_value, user_id) values ("${req.body.slot_id}", (Select slot_value from slots where slot_id="${req.body.slot_id}"), (Select user_id from users where email="${authData.user.email}"));
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
				`SELECT revealed_slots.timestamp, revealed_slots.slot_id, revealed_slots.slot_value, revealed_slots.user_id FROM slots, revealed_slots WHERE revealed_slots.user_id = (Select user_id from users where email="${authData.user.email}") && slots.slot_id=revealed_slots.slot_id`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage,
							sql: err.sql
						});
					} else {
						let date = new Date();
						date =
							date.getUTCFullYear() +
							"-" +
							pad(date.getUTCMonth() + 1) +
							"-" +
							pad(date.getUTCDate()) +
							" " +
							pad(date.getUTCHours()) +
							":" +
							pad(date.getUTCMinutes()) +
							":" +
							pad(date.getUTCSeconds());
						date = date.split(" ").shift();
						let sqlDate = "";
						if (results.length > 0) {
							sqlDate = new Date(results[results.length - 1].timestamp);
							sqlDate =
								sqlDate.getUTCFullYear() +
								"-" +
								pad(sqlDate.getUTCMonth() + 1) +
								"-" +
								pad(sqlDate.getUTCDate()) +
								" " +
								pad(sqlDate.getUTCHours()) +
								":" +
								pad(sqlDate.getUTCMinutes()) +
								":" +
								pad(sqlDate.getUTCSeconds());
							sqlDate = sqlDate.split(" ").shift();
						}
						console.log(date, sqlDate);
						res.send({
							allowScan: date === sqlDate ? false : true,
							slots: results
						});
					}
				}
			);
		}
	});
});

var pad = function(num) {
	return ("00" + num).slice(-2);
};

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
