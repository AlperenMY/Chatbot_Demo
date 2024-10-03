import { useState, useEffect, useRef } from "react";
import { TextField, IconButton, Box, Container } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import ChatBubble from "./ChatBubble";

import questions from "./questions";

const ChatApp = () => {
	//States
	const [input, setInput] = useState("");
	const [isTyped, setIsTyped] = useState(false);
	const [questionIndex, setQuestionIndex] = useState(0);
	const [messageQueue, setMessageQueue] = useState([
		{ text: "Welcome to my chatbot!", fromBot: true },
	]);

	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll işlemi
	};

	useEffect(() => {
		scrollToBottom(); // Her mesaj güncellendiğinde sayfa en alta kaydırılacak
	}, [messageQueue]);

	useEffect(() => {
		if (
			isTyped &&
			questionIndex < questions.length &&
			(messageQueue.length < 2 ||
				messageQueue[messageQueue.length - 1].fromBot === false)
		) {
			setIsTyped(false);
			setMessageQueue([
				...messageQueue,
				{ text: questions[questionIndex], fromBot: true },
			]);
			setQuestionIndex((index) => index + 1);
		}
	}, [isTyped]);

	const handleSubmit = () => {
		if (input.trim() !== "") {
			setIsTyped(false);
			setMessageQueue([...messageQueue, { text: input, fromBot: false }]);
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
						message={message.text}
						fromBot={message.fromBot}
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
					placeholder="Cevabınızı buraya yazınız!"
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
