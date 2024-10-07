require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoSanitize = require("express-mongo-sanitize");
const MongoStore = require("connect-mongo");
const cors = require("cors");

const AnswerList = require("./schema/answerList");

const app = express();
const dbUrl = process.env.DBURL;
const port = process.env.PORT;
const sessionConfig = {
	name: "chtbtuid",
	store: MongoStore.create({
		mongoUrl: dbUrl,
		touchAfter: 24 * 60 * 60,
		crypto: {
			secret: process.env.MONGO_STORE_SECRET,
		},
	}),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 7,
		httpOnly: false,
		sameSite: "lax",
		secure: false,
	},
};

mongoose
	.connect(dbUrl)
	.then(() => {
		console.log("MongoDB connected successfully!");
	})
	.catch((err) => {
		console.log("MongoDB Eror: ", err);
	});

app.use(express.json());
app.use(session(sessionConfig));
app.use(mongoSanitize({ allowDots: true }));
app.use(
	cors({
		origin: process.env.FRONTEND_URL,
		methods: ["GET", "POST"],
		allowedHeaders: [
			"Authorization",
			"content-type",
			"Access-Control-Allow-Credentials",
			"x-access-token",
			"x-platform",
		],
		credentials: true,
	})
);

/**
 * Handles the retrieval of the current question index and user name.
 * If the question index is not set in the session, it initializes it to 0.
 *
 * @param {Object} req - The request object containing session data.
 * @param {Object} res - The response object to send back to the client.
 *
 * @returns {Object} - The response object with status 200 and a JSON object containing:
 * - success: A boolean indicating the success of the operation.
 * - questionIndex: The current question index that is stored in req.session.
 * - name: The user name stored in req.session if the question index is greater than 0 to greet user.
 */
app.get("/whichQuestion", (req, res) => {
	if (!req.session.questionIndex) {
		req.session.questionIndex = 0;
	}
	return res.status(200).send({
		success: true,
		questionIndex: req.session.questionIndex,
		name: req.session.questionIndex > 0 ? req.session.name : undefined,
	});
});

/**
 * Handles the registration process by storing the user's name in the session.
 *
 * @param {Object} req - The request object containing the user's name in the request body.
 * @param {Object} res - The response object to send back to the client.
 *
 * @returns {Object} - The response object with status 200 and a JSON object containing:
 * - success: A boolean indicating the success of the operation.
 * - name: The user's name.
 */
app.post("/register", (req, res) => {
	const name = req.body.name;
	req.session.name = name;
	return res.status(200).send({ success: true, name: req.session.name });
});
/**
 * Handles the saving process user's answers to db.
 *
 * @param {Object} req - The request object containing the user's answer and the question.
 * @param {Object} res - The response object to send back to the client.
 *
 * @returns {Object} - The response object with status 200 and a JSON object containing:
 * - success: A boolean indicating the success of the operation.
 * - questionIndex: incremented question index.
 */
app.post("/answer", async (req, res) => {
	try {
		await AnswerList.findOneAndUpdate(
			{ sessionId: req.session.id },
			{
				$push: {
					answerList: { question: req.body.question, answer: req.body.answer },
				},
			},
			{ upsert: true }
		);
		req.session.questionIndex += 1;
		return res
			.status(200)
			.send({ success: true, questionIndex: req.session.questionIndex });
	} catch (error) {
		console.log(error);
		return res.status(500).send({ success: true, message: error.message });
	}
});

app.listen(port, () => {
	console.log(`LISTENING ON PORT ${port}`);
});
