import React, { useState } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import DocumentUpload from './components/DocumentUpload';
import TaskManager from './components/TaskManager';
import IdeaStarters from './components/IdeaStarters';
import BrainstormingCommands from './components/BrainstormingCommands';
import ReportGenerator from './components/ReportGenerator';
import { queryAqsApi } from '../../services/aqsService';
import { queryAirnowApi } from '../../services/airnowService';
import aiService from '../../services/aiService';

const OIDDirector = () => {
  const [messages, setMessages] = useState([]);
  const [reports, setReports] = useState([]);
  const [airnowApiKey] = useState(''); // TODO: Securely store and retrieve API key

  const handleSendMessage = (text) => {
    const newMessage = { text, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // Log the question
    fetch('/api/chat/log-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: text }),
    });

    // Command handling
    const lowerCaseText = text.toLowerCase();

    if (lowerCaseText.startsWith('/scamper')) {
      const botMessage = { text: 'SCAMPER is a brainstorming technique that uses action verbs to prompt new ideas. Let\'s start with **Substitute**. What part of your project or problem could you replace with something else?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/reverse-brainstorming')) {
      const botMessage = { text: 'Reverse brainstorming focuses on creating problems and then solving them. Let\'s start by identifying all the ways a project could fail. What is one potential problem?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/starbursting')) {
      const botMessage = { text: 'Starbursting is a technique for generating questions rather than answers. Let\'s start with your core topic. What is the central idea you want to explore?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/mind-mapping')) {
      const botMessage = { text: 'Mind mapping is a visual way to organize information. While I can\'t create a visual map here, I can help you structure your ideas. What is the central concept you want to build upon?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/round-robin')) {
      const botMessage = { text: 'Round-robin brainstorming is a simple way to ensure everyone contributes. Let\'s start with the first person. What is your idea?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/rapid-ideation')) {
      const botMessage = { text: 'Rapid ideation is about quantity over quality. Let\'s set a timer for 5 minutes and see how many ideas we can generate. Ready, set, go!', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/figure-storming')) {
      const botMessage = { text: 'Figure storming is a fun way to get a new perspective. Who is a well-known figure (real or fictional) that you admire? How would they solve this problem?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/swot-analysis')) {
      const botMessage = { text: 'A SWOT analysis helps you identify Strengths, Weaknesses, Opportunities, and Threats. Let\'s start with **Strengths**. What are the internal advantages of your project or idea?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/five-whys')) {
      const botMessage = { text: 'The Five Whys is a technique for exploring the root cause of a problem. Let\'s start with the problem you are facing. What is it?', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (lowerCaseText.startsWith('/brainwriting')) {
      const botMessage = { text: 'Brainwriting is a collaborative way to build on ideas. I\'ll act as the central repository. Please send me your first idea, and I will share it with the group for feedback and additions.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else if (text.startsWith('*query-aqs')) {
      const params = text.split(' ').slice(1).join(' ');
      queryAqsApi('some-endpoint', params).then(response => {
        const botMessage = { text: JSON.stringify(response, null, 2), sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      });
    } else if (text.startsWith('*query-airnow')) {
      const zipCode = text.split(' ')[1];
      if (!airnowApiKey) {
        const botMessage = { text: 'AirNow API key is not set. Please provide it in the settings.', sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
        return;
      }
      queryAirnowApi(zipCode, airnowApiKey).then(response => {
        const botMessage = { text: JSON.stringify(response, null, 2), sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      });
    } else if (text.toLowerCase().includes('report') && text.toLowerCase().includes('brief')) {
      const newReport = {
        title: `Report generated from chat on ${new Date().toLocaleDateString()}`,
        content: messages.map(m => `${m.sender}: ${m.text}`).join('\n'),
        date: new Date().toLocaleDateString(),
      };
      setReports(prevReports => [...prevReports, newReport]);
      const botMessage = { text: 'I have generated a report based on our conversation. You can view and download it below.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } else {
      // Default OID Director Assistant response
      aiService.queryAI(text, false).then(response => {
        const botMessage = { text: response, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      });
    }
  };
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        OID Director Assistant
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, Rhea Jones. Your OID Director Assistant is here to help you with planning and management tasks for the Outreach and Information Division.
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* BMAD Agent Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">OID Director Assistant</Typography>
            <ChatWindow messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
          </Paper>
          <ReportGenerator reports={reports} />
        </Grid>

        {/* Document Upload and Task Management */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <BrainstormingCommands />
          </Paper>
          <Paper sx={{ p: 2, mb: 3 }}>
            <DocumentUpload />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <TaskManager />
          </Paper>
          <Paper sx={{ p: 2, mt: 3 }}>
            <IdeaStarters />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OIDDirector;
