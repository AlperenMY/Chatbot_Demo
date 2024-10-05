const mongoose = require("mongoose");

const AnswerListSchema = new mongoose.Schema(
	{
		sessionId: String,
		answerList: [
			{
				question: String,
				answer: String,
				timestamp: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("AnswerList", AnswerListSchema);
