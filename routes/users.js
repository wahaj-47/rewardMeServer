var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var jwt = require("jsonwebtoken");

var connectionObject = require("./connection");
var connection = mysql.createConnection(connectionObject.development);

/* GET users listing. */
router.post("/", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(`Select * from users`, function(err, results, fields) {
				if (err) {
					res.send({
						error: err.code,
						msg: err.sqlMessage
					});
				} else {
					res.send({ users: results });
				}
			});
		}
	});
});

router.post("/delete", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Delete from users where email="${authData.user.email}"`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage
						});
					} else {
						res.send({ success: true, results });
					}
				}
			);
		}
	});
});

router.post("/deleteUser", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Delete from users where email="${req.body.email}"`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage
						});
					} else {
						res.send({ success: true, results });
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
