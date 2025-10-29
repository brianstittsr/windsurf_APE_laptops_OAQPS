import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

const ChatInput = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your message..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button variant="contained" color="primary" onClick={handleSend} sx={{ ml: 1 }}>
        Send
      </Button>
    </Box>
  );
};

export default ChatInput;
