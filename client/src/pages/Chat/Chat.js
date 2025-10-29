import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar, 
  CircularProgress, Alert, IconButton, Paper, Grid
} from '@mui/material';
import {
  Send as SendIcon, SmartToy as BotIcon, Person as PersonIcon, Clear as ClearIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from 'react-query';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import aiService from '../../services/aiService';
import localStorageService from '../../services/localStorageService';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [currentAiSettings, setCurrentAiSettings] = useState(() => aiService.getSettings());
  const messagesEndRef = useRef(null);

  // Refresh AI settings when component mounts or when returning from settings
  React.useEffect(() => {
    const refreshSettings = () => {
      setCurrentAiSettings(aiService.getSettings());
    };
    
    // Refresh settings when component mounts
    refreshSettings();
    
    // Listen for focus events to refresh when returning from settings
    window.addEventListener('focus', refreshSettings);
    
    return () => {
      window.removeEventListener('focus', refreshSettings);
    };
  }, []);

  const getProviderDisplayName = (provider) => {
    const providerNames = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google AI',
      azure: 'Azure OpenAI'
    };
    return providerNames[provider] || provider;
  };

  const getModelDisplayName = (model, provider) => {
    const modelNames = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash'
    };
    return modelNames[model] || model;
  };

  const sendMessageMutation = useMutation(
    async ({ message, conversationId, reportType }) => {
      let aiResponse;
      
      // Use specialized methods for different report types
      if (reportType) {
        switch (reportType) {
          case 'forecast':
            aiResponse = await aiService.generateForecastReport('comprehensive');
            break;
          case 'trend':
            aiResponse = await aiService.generateTrendAnalysis();
            break;
          case 'risk':
            aiResponse = await aiService.generateRiskAssessment();
            break;
          case 'vendor':
            aiResponse = await aiService.queryAI('Analyze vendor performance and provide recommendations for contract optimization');
            break;
          default:
            aiResponse = await aiService.queryAI(message);
        }
      } else {
        // Check message content for report keywords
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('forecast') || lowerMessage.includes('budget projection')) {
          aiResponse = await aiService.generateForecastReport('comprehensive');
        } else if (lowerMessage.includes('trend analysis') || lowerMessage.includes('pattern')) {
          aiResponse = await aiService.generateTrendAnalysis();
        } else if (lowerMessage.includes('risk assessment') || lowerMessage.includes('risk analysis')) {
          aiResponse = await aiService.generateRiskAssessment();
        } else {
          console.log('Calling aiService.queryAI with message:', message);
          aiResponse = await aiService.queryAI(message);
          console.log('AI Response received:', aiResponse.substring(0, 100) + '...');
        }
      }
      
      localStorageService.addConversation({
        message, response: aiResponse,
        context: { invoicesAnalyzed: localStorageService.getInvoices().length }
      });
      return {
        success: true,
        data: {
          response: aiResponse,
          conversationId: conversationId || 'conv_' + Date.now(),
          context: { invoicesAnalyzed: localStorageService.getInvoices().length }
        }
      };
    },
    {
      onSuccess: (data) => {
        setConversation(prev => [...prev, {
          type: 'bot', content: data.data.response,
          timestamp: new Date().toISOString(), context: data.data.context,
        }]);
        setConversationId(data.data.conversationId);
      },
      onError: (error) => {
        toast.error('Failed to send message');
        setConversation(prev => [...prev, {
          type: 'error', content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        }]);
      },
    }
  );

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setConversation(prev => [...prev, {
      type: 'user', content: message, timestamp: new Date().toISOString(),
    }]);
    const currentMessage = message;
    setMessage('');
    sendMessageMutation.mutate({ message: currentMessage, conversationId });
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    return (
      <Box sx={{ mb: 2, display: 'flex', 
        justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <Paper sx={{ p: 2, maxWidth: '80%', 
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary' }}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {message.context && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Analyzed {message.context.invoicesAnalyzed} invoices • 
                Total Value: ${message.context.totalValue?.toLocaleString()} •
                Provider: {getProviderDisplayName(currentAiSettings.provider)}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        AI Chat Assistant
      </Typography>
      <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Advanced AI Analyst</Typography>
          <Typography variant="caption" color="textSecondary">
            Powered by {getProviderDisplayName(currentAiSettings.provider)} {getModelDisplayName(currentAiSettings.model)} - Advanced forecasting, trend analysis & risk assessment
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {conversation.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Advanced AI Analyst Ready!</strong><br/>
              Try: "Generate a comprehensive forecast report" or use the quick action buttons below.
            </Alert>
          ) : (
            conversation.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))
          )}
          {sendMessageMutation.isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">
                Generating advanced analysis with {getProviderDisplayName(currentAiSettings.provider)} {getModelDisplayName(currentAiSettings.model)}...
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me about your invoice data..." variant="outlined" size="small"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />
            <Button variant="contained" onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isLoading}>
              <SendIcon />
            </Button>
          </Box>
          
          {/* Quick Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button size="small" variant="outlined" 
              onClick={() => {
                const reportMessage = 'Generate comprehensive forecast report';
                setConversation(prev => [...prev, {
                  type: 'user', content: reportMessage, timestamp: new Date().toISOString(),
                }]);
                sendMessageMutation.mutate({ 
                  message: reportMessage, 
                  conversationId, 
                  reportType: 'forecast' 
                });
              }}
              disabled={sendMessageMutation.isLoading}>
              📊 Forecast Report
            </Button>
            <Button size="small" variant="outlined"
              onClick={() => {
                const reportMessage = 'Perform advanced trend analysis';
                setConversation(prev => [...prev, {
                  type: 'user', content: reportMessage, timestamp: new Date().toISOString(),
                }]);
                sendMessageMutation.mutate({ 
                  message: reportMessage, 
                  conversationId, 
                  reportType: 'trend' 
                });
              }}
              disabled={sendMessageMutation.isLoading}>
              📈 Trend Analysis
            </Button>
            <Button size="small" variant="outlined"
              onClick={() => {
                const reportMessage = 'Conduct comprehensive risk assessment';
                setConversation(prev => [...prev, {
                  type: 'user', content: reportMessage, timestamp: new Date().toISOString(),
                }]);
                sendMessageMutation.mutate({ 
                  message: reportMessage, 
                  conversationId, 
                  reportType: 'risk' 
                });
              }}
              disabled={sendMessageMutation.isLoading}>
              ⚠️ Risk Assessment
            </Button>
            <Button size="small" variant="outlined"
              onClick={() => {
                const reportMessage = 'Analyze vendor performance and optimization';
                setConversation(prev => [...prev, {
                  type: 'user', content: reportMessage, timestamp: new Date().toISOString(),
                }]);
                sendMessageMutation.mutate({ 
                  message: reportMessage, 
                  conversationId, 
                  reportType: 'vendor' 
                });
              }}
              disabled={sendMessageMutation.isLoading}>
              🏢 Vendor Analysis
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default Chat;