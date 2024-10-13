import { useState, useEffect } from "react";
import { Paper, Typography, Box } from "@mui/material";
//message: Text to write to bubble
//role: to decide bubble position and color
//setIsTyped: function to call when typing animation completes
const ChatBubble = ({ message, role, isNew, setIsTyped }) => {
	const [displayedMessage, setDisplayedMessage] = useState(message[0]);

	const typingSpeed = 50; //ms

	useEffect(() => {
		if (role === "assistant" && isNew) {
			//if this a bot bubble than a typing animation will be triggered
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
				justifyContent: role === "assistant" ? "flex-start" : "flex-end",
				mb: 2,
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 2,
					maxWidth: "60%",
					backgroundColor: role === "assistant" ? "#f5f5f5" : "#1976d2",
					color: role === "assistant" ? "black" : "white",
					borderRadius:
						role === "assistant" ? "0px 16px 16px 16px" : "16px 16px 0px 16px",
				}}
			>
				<Typography>{displayedMessage}</Typography>
			</Paper>
		</Box>
	);
};

export default ChatBubble;
