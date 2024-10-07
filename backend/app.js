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

app.post("/register", (req, res) => {
	const name = req.body.name;
	req.session.name = name;
	return res.status(200).send({ success: true, name: req.session.name });
});

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
