import React, { useState, useRef } from 'react';
import { Container, Grid, Paper, Typography, Box, Button } from '@mui/material';
import ChatWindow from '../OIDDirector/components/ChatWindow'; // Reusing the component
import ChatInput from '../OIDDirector/components/ChatInput';   // Reusing the component
import { Print as PrintIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AirNowAqs = () => {
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const lastResponseData = useRef(null);

  const handleSendMessage = async (text) => {
    const newMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setIsGenerating(true);

    // Placeholder for API logic
    setTimeout(() => {
      const botMessage = { 
        text: `I received your query: **${text}**. I am not yet connected to the AIRNOW/AQS APIs, but this is where the response would appear.`, 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
      setIsGenerating(false);
    }, 1000);
  };

  const handleGenerateReport = () => {
    if (!lastResponseData.current) {
      alert('No data available to generate a report. Please perform a query first.');
      return;
    }

    const doc = new jsPDF();
    doc.text('AIRNOW / AQS Data Report', 14, 16);

    const tableData = lastResponseData.current.map(item => [
      item.ParameterName,
      item.AQI,
      item.Category.Name,
      item.DateObserved,
      item.ReportingArea
    ]);

    doc.autoTable({
      head: [['Parameter', 'AQI', 'Category', 'Date', 'Location']],
      body: tableData,
      startY: 20,
    });

    doc.save('airnow-aqs-report.pdf');
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <img src="https://www.airnow.gov/sites/default/files/2021-10/airnow-logo-2021.png" alt="AirNow Logo" style={{ height: '50px', marginRight: '16px' }} />
        <Typography variant="h4" gutterBottom>
          AIRNOW - AQS Assistant
        </Typography>
      </Box>
      <Typography variant="subtitle1" gutterBottom>
        Ask questions about air quality data from AIRNOW and AQS.
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <ChatWindow messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} isSending={isGenerating} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Report Generation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              After getting a result from the assistant, you can generate a PDF report.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handleGenerateReport}
              disabled={!lastResponseData.current}
            >
              Generate PDF Report
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AirNowAqs;
