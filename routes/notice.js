const { Expo } = require("expo-server-sdk");
var express = require("express");
var router = express.Router();
// Create a new Expo SDK client
let expo = new Expo();

var jwt = require("jsonwebtoken");

var mysql = require("mysql");

var connection = mysql.createConnection({
	host: "localhost",
	user: "root@",
	password: "",
	database: "rewardme",
	multipleStatements: true
});

router.get("/all", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			connection.query(
				`Select * from notice, personal_notice where notice_type = "personal" && notice.notice_id = personal_notice.notice_id && personal_notice.user_id = (Select user_id from users where email="${authData.user.email}"); 
                Select * from notice where notice_type = "general"`,
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
				msg: req.body.msg,
				expiration_date: req.body.expiration_date
			};
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
								console.error(error);
							}
						}
						for (let ticket of tickets) {
							connection.query(
								`Insert into notice set ?`,
								{ notice_id: ticket.id, ...notice },
								function(err, results, fields) {
									if (err) {
										res.send({
											error: err.code,
											msg: err.sqlMessage
										});
									}
								}
							);
						}
					})();

					res.send({ noticeSent: true });
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
			let device_tokens = req.body.device_tokens;
			console.log(device_tokens);
			let notice = {
				notice_type: "personal",
				title: req.body.title,
				subtitle: req.body.subtitle,
				msg: req.body.msg,
				expiration_date: req.body.expiration_date
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
							`Insert into notice set ?; Insert into personal_notice (notice_id, user_id) values ("${ticket.id}", (Select user_id from device_tokens where device_token="${device.device_token}"));`,
							{ notice_id: ticket.id, ...notice },
							function(err, results, fields) {
								if (err) {
									res.send({
										error: err.code,
										msg: err.sqlMessage,
										sql: err.sql
									});
								} else {
									res.send({ results });
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
