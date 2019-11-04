const { Expo } = require("expo-server-sdk");
var express = require("express");
var router = express.Router();
// Create a new Expo SDK client
let expo = new Expo();
var randomstring = require("randomstring");

var jwt = require("jsonwebtoken");

var mysql = require("mysql");

var connectionObject = require("./connection");
var connection = mysql.createConnection({
	...connectionObject.development,
	multipleStatements: true
});

router.get("/", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Select * from notice order by publishedDate desc`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage
						});
					} else {
						res.send({ results });
					}
				}
			);
		}
	});
});

router.post("/delete", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			console.log("something");
			console.log(req.body);
			connection.query(
				`Delete from notice where notice_id = "${req.body.notice_id}"`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage
						});
					} else {
						res.send({ results });
					}
				}
			);
		}
	});
});

router.get("/all", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Select * from notice, personal_notice where notice_type = "personal" && notice.notice_id = personal_notice.notice_id && personal_notice.user_id = (Select user_id from users where email="${authData.user.email}") order by publishedDate; 
                Select * from notice where notice_type = "general" order by publishedDate`,
				function(err, results, fields) {
					if (err) {
						res.send({
							error: err.code,
							msg: err.sqlMessage
						});
					} else {
						res.send({ results });
					}
				}
			);
		}
	});
});

router.post("/general", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			let notice = {
				notice_type: "general",
				title: req.body.title,
				subtitle: req.body.subtitle,
				msg: req.body.msg
			};
			connection.on("error", function(err) {
				console.log(err);
			});
			connection.query(`Select * from device_tokens;`, notice, function(
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
					let messages = [];
					results.map(device => {
						// Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

						// Check that all your push tokens appear to be valid Expo push tokens
						if (!Expo.isExpoPushToken(device.device_token)) {
							console.error(
								`Push token ${device.device_token} is not a valid Expo push token`
							);
						}

						// Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
						messages.push({
							to: device.device_token,
							title: notice.title,
							sound: "default",
							subtitle: notice.subtitle,
							data: {
								title: notice.title,
								subtitle: notice.subtitle,
								msg: notice.msg
							}
						});
					});

					let chunks = expo.chunkPushNotifications(messages);
					let tickets = [];

					(async () => {
						// Send the chunks to the Expo push notification service. There are
						// different strategies you could use. A simple one is to send one chunk at a
						// time, which nicely spreads the load out over time:
						for (let chunk of chunks) {
							try {
								let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
								console.log(ticketChunk);

								tickets.push(...ticketChunk);
								// NOTE: If a ticket contains an error code in ticket.details.error, you
								// must handle it appropriately. The error codes are listed in the Expo
								// documentation:
								// https://docs.expo.io/versions/latest/guides/push-notifications#response-format
							} catch (error) {
								console.log(error);
							}
						}

						connection.query(
							`Insert into notice set ?`,
							{
								notice_id: randomstring.generate({
									length: 36
								}),
								...notice
							},
							function(error, results, fields) {
								if (error) {
									res.send({
										error: err.code,
										msg: err.sqlMessage
									});
								} else {
									res.send({ noticeSent: true });
								}
							}
						);
					})();
				}
			});
		}
	});
});

router.post("/personal", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			console.log(req.body.user);
			let user_id = req.body.user.user_id;
			let device_tokens = req.body.user.device_token;
			console.log(device_tokens.length);
			let notice = {
				notice_type: "personal",
				title: req.body.title,
				subtitle: req.body.subtitle,
				msg: req.body.msg
			};

			let messages = [];

			device_tokens.map(device => {
				// Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

				// Check that all your push tokens appear to be valid Expo push tokens
				if (!Expo.isExpoPushToken(device.device_token)) {
					console.error(
						`Push token ${device.device_token} is not a valid Expo push token`
					);
				}

				// Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
				messages.push({
					to: device.device_token,
					title: notice.title,
					sound: "default",
					subtitle: notice.subtitle,
					data: {
						title: notice.title,
						subtitle: notice.subtitle,
						msg: notice.msg
					}
				});

				let chunks = expo.chunkPushNotifications(messages);
				let tickets = [];
				(async () => {
					// Send the chunks to the Expo push notification service. There are
					// different strategies you could use. A simple one is to send one chunk at a
					// time, which nicely spreads the load out over time:
					for (let chunk of chunks) {
						try {
							let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
							console.log(ticketChunk);
							tickets.push(...ticketChunk);
							// NOTE: If a ticket contains an error code in ticket.details.error, you
							// must handle it appropriately. The error codes are listed in the Expo
							// documentation:
							// https://docs.expo.io/versions/latest/guides/push-notifications#response-format
						} catch (error) {
							console.error(error);
						}
					}

					for (let ticket of tickets) {
						connection.query(
							`Insert into notice set ?; Insert into personal_notice (notice_id, user_id) values ("${ticket.id}", "${user_id}");`,
							{ notice_id: ticket.id, ...notice },
							function(err, results, fields) {
								if (err) {
									res.send({
										error: err.code,
										msg: err.sqlMessage,
										sql: err.sql
									});
								} else {
									res.send({ results, noticeSent: true });
								}
							}
						);
					}
				})();
			});
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
