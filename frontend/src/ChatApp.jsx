import { useState, useEffect, useRef, useCallback } from "react";
import { TextField, IconButton, Box, Container } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import axios from "axios";

import ChatBubble from "./ChatBubble";

import questions from "./questions";

const ChatApp = () => {
	//States
	const [input, setInput] = useState(""); //textField input state
	const [isTyped, setIsTyped] = useState(false); //to check if chatbot typing animation is finished
	const [messageQueue, setMessageQueue] = useState([]); //messages queue that is rendered
	const [answerList, setAnswerList] = useState([]); //previous conversation get from DB

	const apiUrl = "http://localhost:3000";

	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // for Scroll purposes
	};

	//async functions
	const getAnswerList = useCallback(async () => {
		try {
			const response = await axios.get(`${apiUrl}/answerList`, {
				withCredentials: true,
			});
			console.log("answerList", response.data);
			setAnswerList(response.data.answerList);
		} catch (error) {
			console.error("Error fetching answerList:", error);
			return null;
		}
	}, []);

	const askQuestion = useCallback(async (messageQueue) => {
		try {
			const response = await axios.post(
				`${apiUrl}/askQuestion`,
				{ messageQueue },
				{ withCredentials: true }
			);
			setMessageQueue([
				...messageQueue,
				{ role: "assistant", content: response.data.message.content, new: true },
			]);
		} catch (error) {
			console.error("Error asking question:", error);
			return null;
		}
	}, []);

	//Only on first render - get the answerList of the session from DB
	useEffect(() => {
		getAnswerList();
	}, []);

	//Check answerList to start conversation
	useEffect(() => {
		if (answerList && answerList.length > 0) {
			const savedChat = [];
			answerList.forEach((item) => {
				savedChat.push(
					...[
						{ role: "assistant", content: item.question, new: false },
						{ role: "user", content: item.answer },
					]
				);
			});
			setMessageQueue(savedChat);
		} else {
			askQuestion([]);
		}
	}, [answerList]);

	//To add chatbots messages to message queue
	useEffect(() => {
		if (isTyped && messageQueue[messageQueue.length - 1].role === "user") {
			//then chatbot next message is added to the queue
			setIsTyped(false);
			askQuestion(messageQueue);
		}
	}, [isTyped]);

	useEffect(() => {
		scrollToBottom(); // On every message queue update scroll to bottom of the page
	}, [messageQueue]);

	const handleSubmit = async () => {
		if (input.trim() !== "") {
			try {
				await axios.post(
					`${apiUrl}/answer`,
					{
						question: messageQueue[messageQueue.length - 1].content,
						answer: input,
					},
					{ withCredentials: true }
				);
			} catch (error) {
				console.error("Error answering question:", error);
				return null;
			}
			setIsTyped(false);
			setMessageQueue([...messageQueue, { role: "user", content: input }]);
			setInput("");
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			handleSubmit();
		}
	};

	return (
		<Container sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			<Box sx={{ flex: 1, overflow: "auto", p: 2, mb: 8 }}>
				{messageQueue.map((message, index) => (
					<ChatBubble
						key={index}
						message={message.content}
						role={message.role}
						isNew={message.new}
						setIsTyped={setIsTyped}
					/>
				))}
				<div ref={messagesEndRef} />
			</Box>
			<Box
				sx={{
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					display: "flex",
					p: 2,
					alignItems: "center",
					backgroundColor: "white",
					boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
				}}
			>
				<TextField
					fullWidth
					autoFocus
					variant="outlined"
					placeholder="Write your answer here!"
					value={input}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={handleKeyDown}
					disabled={!isTyped}
				/>
				<IconButton onClick={handleSubmit} color="primary" disabled={!isTyped}>
					<SendIcon />
				</IconButton>
			</Box>
		</Container>
	);
};

export default ChatApp;
