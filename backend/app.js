require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoSanitize = require("express-mongo-sanitize");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const axios = require("axios");

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
		req.session.startTime = new Date();
	}
	return res.status(200).send({
		success: true,
		questionIndex: req.session.questionIndex,
		name: req.session.questionIndex > 0 ? req.session.name : undefined,
	});
});

app.get("/answerList", async (req, res) => {
	try {
		const userAnswerList = await AnswerList.findOne({
			sessionId: req.session.id,
		});
		return res.status(200).send({
			success: true,
			answerList: userAnswerList?.answerList ? userAnswerList.answerList : [],
		});
	} catch (error) {
		console.error("Error fetching answerList:", error);
		return res
			.status(500)
			.send({ success: false, message: "Internal Server Error" });
	}
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
	console.log("Register", req.session);
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
		console.log(req.session);
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
		// if (req.session.questionIndex === 10) {
		// 	req.session.endTime = new Date();
		// }
		return res
			.status(200)
			.send({ success: true, questionIndex: req.session.questionIndex });
	} catch (error) {
		console.log(error);
		return res.status(500).send({ success: true, message: error.message });
	}
});

app.post("/askQuestion", async (req, res) => {
	try {
		console.log("questionIndex", req.session.questionIndex);
		const openAiAPILink = "https://api.openai.com/v1/chat/completions";
		const model = "gpt-4o";
		const response_format = { type: "text" };
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
		};
		let response;
		if (!req.session.questionIndex) {
			response = await axios.post(
				openAiAPILink,
				{
					model,
					response_format,
					messages: [
						{
							role: "system",
							content:
								"Write a good welcome text for the chatbot made by Alperen, and ask user's name",
						},
					],
				},
				{ headers }
			);
			req.session.questionIndex = 0;
			req.session.startTime = new Date();
		} else if (req.session.questionIndex === 1) {
			response = await axios.post(
				openAiAPILink,
				{
					model,
					response_format,
					messages: [
						...req.body.messageQueue,
						{
							role: "system",
							content:
								"Ask a one question about cats like 'What is your favorite breed of cat, and why?'.",
						},
					],
				},
				{ headers }
			);
		} else {
			response = await axios.post(
				openAiAPILink,
				{
					model,
					response_format,
					messages: [
						...req.body.messageQueue,
						{
							role: "system",
							content: "Ask another question about cats based on user's answer.",
						},
					],
				},
				{ headers }
			);
		}
		return res
			.status(200)
			.send({ success: true, message: response.data.choices[0].message });
	} catch (error) {
		console.log(error);
		return res
			.status(error.status || 500)
			.send({ success: true, message: error.response.data });
	}
});

app.listen(port, () => {
	console.log(`LISTENING ON PORT ${port}`);
});
