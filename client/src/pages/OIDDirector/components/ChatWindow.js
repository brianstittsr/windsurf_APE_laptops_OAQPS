import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

const ChatWindow = ({ messages }) => {
  return (
    <Box sx={{ flexGrow: 1, my: 2, border: '1px solid #ccc', borderRadius: 1, p: 2, overflowY: 'auto' }}>
      {messages.map((message, index) => (
        <Paper key={index} sx={{ p: 1.5, mb: 1.5, bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.200' }}>
          {message.sender === 'bot' ? (
            <ReactMarkdown>{message.text}</ReactMarkdown>
          ) : (
            <Typography variant="body1">{message.text}</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default ChatWindow;
