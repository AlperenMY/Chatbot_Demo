import { useState, useEffect } from "react";
import { Paper, Typography, Box } from "@mui/material";

const ChatBubble = ({ message, fromBot, setIsTyped }) => {
	const [displayedMessage, setDisplayedMessage] = useState(message[0]);

	const typingSpeed = 50; //ms

	useEffect(() => {
		if (fromBot) {
			let currIndex = 0;
			const intervalId = setInterval(() => {
				if (currIndex >= message.length - 1) {
					clearInterval(intervalId);
					setIsTyped(true);
					return;
				}
				currIndex += 1;
				setDisplayedMessage((currMsg) => currMsg + message[currIndex]);
			}, typingSpeed);
			return () => clearInterval(intervalId);
		} else {
			setDisplayedMessage(message);
			setIsTyped(true);
		}
	}, [message]);
	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: fromBot ? "flex-start" : "flex-end",
				mb: 2,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 2,
					maxWidth: "60%",
					backgroundColor: fromBot ? "#f5f5f5" : "#1976d2",
					color: fromBot ? "black" : "white",
					borderRadius: fromBot ? "0px 16px 16px 16px" : "16px 16px 0px 16px",
				}}
			>
				<Typography>{displayedMessage}</Typography>
			</Paper>
		</Box>
	);
};

export default ChatBubble;
