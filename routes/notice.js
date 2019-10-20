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
	database: "rewardme"
});

router.post("/general", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", (err, authData) => {
		if (err) {
			res.send({ error: err });
		} else {
			let msg = req.body.msg;
			connection.query("Select * from device_tokens", function(
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
					res.send({ results });
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
							sound: "default",
							body: "This is a test notification",
							data: { withSome: "data" }
						});

						let chunks = expo.chunkPushNotifications(messages);
						let tickets = [];
						(async () => {
							// Send the chunks to the Expo push notification service. There are
							// different strategies you could use. A simple one is to send one chunk at a
							// time, which nicely spreads the load out over time:
							for (let chunk of chunks) {
								try {
									let ticketChunk = await expo.sendPushNotificationsAsync(
										chunk
									);
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
						})();
					});
				}
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
