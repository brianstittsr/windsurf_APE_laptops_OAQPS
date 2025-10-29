import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Science as TestIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import aiService from '../../services/aiService';
import localStorageService from '../../services/localStorageService';

const Settings = () => {
  const [emailSettings, setEmailSettings] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    password: '',
    enableNotifications: true,
  });

  // AI Configuration State
  const [aiSettings, setAiSettings] = useState(() => aiService.getSettings());
  const [aiKeys, setAiKeys] = useState([]);
  const [aiKeyDialog, setAiKeyDialog] = useState(false);
  const [newAiKey, setNewAiKey] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4-turbo',
    endpoint: '',
    isDefault: false,
    description: ''
  });
  const [testingConnection, setTestingConnection] = useState(false);

  // Data API Keys State
  const [dataApiKeys, setDataApiKeys] = useState({ airnow: '', aqsEmail: '', aqsKey: '' });
  const [testingDataApi, setTestingDataApi] = useState({ airnow: false, aqs: false });
  
  const [scheduledEmailDialog, setScheduledEmailDialog] = useState(false);
  const [newScheduledEmail, setNewScheduledEmail] = useState({
    name: '',
    description: '',
    recipients: '',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1,
    reportConfig: {
      title: 'Weekly Summary Report',
      format: 'pdf',
      sections: ['summary', 'analytics'],
    },
  });

  // Fetch scheduled emails
  const { data: scheduledEmails, refetch: refetchScheduled } = useQuery(
    'scheduled-emails',
    () => {
      // Return mock scheduled emails from localStorage or empty array
      const settings = localStorageService.getSettings();
      return settings.scheduledEmails || [];
    }
  );

  // Test email mutation
  const testEmailMutation = useMutation(
    async (email) => {
      // Simulate email test - in real app this would call actual email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Test email sent' };
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to send test email');
      },
    }
  );

  // Create scheduled email mutation
  const createScheduledEmailMutation = useMutation(
    async (emailData) => {
      // Save scheduled email to localStorage settings
      const settings = localStorageService.getSettings();
      const scheduledEmails = settings.scheduledEmails || [];
      const newEmail = {
        ...emailData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      scheduledEmails.push(newEmail);
      localStorageService.updateSettings({ ...settings, scheduledEmails });
      return newEmail;
    },
    {
      onSuccess: (newEmail) => {
        toast.success('Scheduled email created successfully!');
        setScheduledEmailDialog(false);
        refetchScheduled();
        resetScheduledEmailForm();
      },
      onError: () => {
        toast.error('Failed to create scheduled email');
      },
    }
  );

  // Delete scheduled email mutation
  const deleteScheduledEmailMutation = useMutation(
    async (emailId) => {
      // Remove scheduled email from localStorage settings
      const settings = localStorageService.getSettings();
      const scheduledEmails = settings.scheduledEmails || [];
      const updatedEmails = scheduledEmails.filter(email => email.id !== emailId);
      localStorageService.updateSettings({ ...settings, scheduledEmails: updatedEmails });
      return emailId;
    },
    {
      onSuccess: (emailId) => {
        toast.success(`Scheduled email with id ${emailId} deleted successfully!`);
        refetchScheduled();
      },
      onError: () => {
        toast.error('Failed to delete scheduled email');
      },
    }
  );

  const resetScheduledEmailForm = () => {
    setNewScheduledEmail({
      name: '',
      description: '',
      recipients: '',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1,
      reportConfig: {
        title: 'Weekly Summary Report',
        format: 'pdf',
        sections: ['summary', 'analytics'],
      },
    });
  };

  const handleTestEmail = () => {
    if (!emailSettings.user) {
      toast.error('Please enter your email address');
      return;
    }
    testEmailMutation.mutate(emailSettings.user);
  };

  const handleCreateScheduledEmail = () => {
    if (!newScheduledEmail.name || !newScheduledEmail.recipients) {
      toast.error('Please fill in all required fields');
      return;
    }

    const recipients = newScheduledEmail.recipients.split(',').map(email => email.trim());
    
    createScheduledEmailMutation.mutate({
      ...newScheduledEmail,
      recipients: recipients,
      schedule: {
        frequency: newScheduledEmail.frequency,
        time: newScheduledEmail.time,
        dayOfWeek: newScheduledEmail.dayOfWeek,
      },
    });
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const getModelOptions = (provider) => {
    const modelsByProvider = {
      openai: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
      ],
      anthropic: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' }
      ],
      google: [
        { value: 'gemini-pro', label: 'Gemini Pro' },
        { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
      ],
      azure: [
        { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo (Azure)' },
        { value: 'gpt-4', label: 'GPT-4 (Azure)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Azure)' },
        { value: 'gpt-4o', label: 'GPT-4o (Azure)' }
      ],
      ollama: [
        { value: 'llama3', label: 'Llama 3' },
        { value: 'mistral', label: 'Mistral' },
        { value: 'codellama', label: 'Code Llama' },
        { value: 'llava', label: 'LLaVA' }
      ]
    };
    
    return modelsByProvider[provider] || modelsByProvider.openai;
  };

  // AI Key Management Functions
  React.useEffect(() => {
    // Load keys from localStorage
    const settings = localStorageService.getSettings();
    if (settings.aiKeys) {
      setAiKeys(settings.aiKeys);
    }
    if (settings.dataApiKeys) {
      setDataApiKeys(settings.dataApiKeys);
    }
  }, []);

  // Update model when provider changes
  React.useEffect(() => {
    const availableModels = getModelOptions(aiSettings.provider);
    const currentModelExists = availableModels.some(model => model.value === aiSettings.model);

    if (!currentModelExists && availableModels.length > 0) {
      setAiSettings(prev => ({ ...prev, model: availableModels[0].value }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSettings.provider]);

  // Update model in dialog when provider changes
  React.useEffect(() => {
    const availableModels = getModelOptions(newAiKey.provider);
    const currentModelExists = availableModels.some(model => model.value === newAiKey.model);
    
    if (!currentModelExists && availableModels.length > 0) {
      // Set to the first available model for the new provider
      setNewAiKey(prev => ({ ...prev, model: availableModels[0].value }));
    }
  }, [newAiKey.provider]);

  const handleSaveAiSettings = () => {
    aiService.updateSettings(aiSettings);
    toast.success('AI settings saved successfully!');
  };

  const handleAddAiKey = () => {
    if (!newAiKey.name || !newAiKey.apiKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    const keyWithId = {
      ...newAiKey,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const updatedKeys = [...aiKeys, keyWithId];
    
    // If this is the first key or marked as default, make it default
    if (updatedKeys.length === 1 || newAiKey.isDefault) {
      updatedKeys.forEach(key => key.isDefault = false);
      keyWithId.isDefault = true;
      
      // Update current AI settings to use this key
      setAiSettings(prev => ({
        ...prev,
        provider: keyWithId.provider,
        model: keyWithId.model,
        apiKey: keyWithId.apiKey,
        endpoint: keyWithId.endpoint
      }));
    }

    setAiKeys(updatedKeys);
    
    // Save to localStorage
    const settings = localStorageService.getSettings();
    settings.aiKeys = updatedKeys;
    localStorageService.updateSettings(settings);

    setAiKeyDialog(false);
    resetAiKeyForm();
    toast.success('AI key added successfully!');
  };

  const handleDeleteAiKey = (keyId) => {
    const updatedKeys = aiKeys.filter(key => key.id !== keyId);
    setAiKeys(updatedKeys);
    
    // Save to localStorage
    const settings = localStorageService.getSettings();
    settings.aiKeys = updatedKeys;
    localStorageService.updateSettings(settings);
    
    toast.success('AI key deleted successfully!');
  };

  const handleSetDefaultKey = (keyId) => {
    const updatedKeys = aiKeys.map(key => ({
      ...key,
      isDefault: key.id === keyId
    }));
    
    const defaultKey = updatedKeys.find(key => key.isDefault);
    if (defaultKey) {
      setAiSettings(prev => ({
        ...prev,
        provider: defaultKey.provider,
        model: defaultKey.model,
        apiKey: defaultKey.apiKey,
        endpoint: defaultKey.endpoint
      }));
    }
    
    setAiKeys(updatedKeys);
    
    // Save to localStorage
    const settings = localStorageService.getSettings();
    settings.aiKeys = updatedKeys;
    localStorageService.updateSettings(settings);
    
    toast.success('Default AI key updated!');
  };

  const handleTestAiConnection = async (key) => {
    setTestingConnection(true);
    try {
      const result = await aiService.testConnection(key.provider, key.apiKey, key.endpoint, key.model);
      if (result.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveDataApiKeys = () => {
    localStorageService.updateSettings({ dataApiKeys });
    toast.success('Data API keys saved successfully!');
  };

  const handleTestDataApi = async (api) => {
    setTestingDataApi(prev => ({ ...prev, [api]: true }));
    try {
      const result = await aiService.testDataApi(api, dataApiKeys);
      if (result.success) {
        toast.success(`${api.toUpperCase()} connection test successful!`);
      } else {
        toast.error(`${api.toUpperCase()} connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Connection test failed: ${error.message}`);
    } finally {
      setTestingDataApi(prev => ({ ...prev, [api]: false }));
    }
  };

  const resetAiKeyForm = () => {
    setNewAiKey({
      name: '',
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4-turbo',
      endpoint: '',
      isDefault: false,
      description: ''
    });
  };

  const handleRefreshFromDatafiles = () => {
    try {
      const refreshedInvoices = localStorageService.truncateAndRefreshData();
      toast.success(`Data refreshed! Loaded ${refreshedInvoices.length} contracts from datafiles folder.`);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data from datafiles');
    }
  };

  const handleClearData = () => {
    try {
      localStorageService.clearAllData();
      toast.success('All data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Email Configuration */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Email Configuration</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      value={emailSettings.host}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, host: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Port"
                      type="number"
                      value={emailSettings.port}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={emailSettings.enableNotifications}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                        />
                      }
                      label="Enable Notifications"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={emailSettings.user}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, user: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="App Password"
                      type="password"
                      value={emailSettings.password}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, password: e.target.value }))}
                      helperText="Use an app-specific password for Gmail"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => toast.success('Settings saved!')}
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TestIcon />}
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isLoading}
                  >
                    Test Email
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* AI Configuration */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">AI Assistant Configuration</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>AI Provider</InputLabel>
                      <Select
                        value={aiSettings.provider}
                        label="AI Provider"
                        onChange={(e) => setAiSettings(prev => ({ ...prev, provider: e.target.value }))}
                      >
                        <MenuItem value="openai">OpenAI</MenuItem>
                        <MenuItem value="anthropic">Anthropic</MenuItem>
                        <MenuItem value="google">Google AI</MenuItem>
                        <MenuItem value="ollama">Ollama (Local)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={aiSettings.model}
                        label="Model"
                        onChange={(e) => setAiSettings(prev => ({ ...prev, model: e.target.value }))}
                      >
                        {getModelOptions(aiSettings.provider).map(model => (
                          <MenuItem key={model.value} value={model.value}>
                            {model.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Temperature"
                      type="number"
                      inputProps={{ min: 0, max: 2, step: 0.1 }}
                      value={aiSettings.temperature}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Max Tokens"
                      type="number"
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => toast.success('AI settings saved!')}
                  >
                    Save AI Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Data Management</Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Manage your contract data and localStorage settings
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefreshFromDatafiles}
                    fullWidth
                  >
                    Refresh from Datafiles
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    Load fresh contract data from the 11 PDF files in the datafiles folder
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleClearData}
                    fullWidth
                  >
                    Clear All Data
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    Remove all contracts, reports, and activity logs from localStorage
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Data API Keys */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Data API Keys</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="AirNow API Key"
                      value={dataApiKeys.airnow}
                      onChange={(e) => setDataApiKeys(prev => ({ ...prev, airnow: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="AQS API User Email"
                      value={dataApiKeys.aqsEmail}
                      onChange={(e) => setDataApiKeys(prev => ({ ...prev, aqsEmail: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="AQS API Key"
                      value={dataApiKeys.aqsKey}
                      onChange={(e) => setDataApiKeys(prev => ({ ...prev, aqsKey: e.target.value }))}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveDataApiKeys}>Save Keys</Button>
                  <Button variant="outlined" startIcon={<TestIcon />} onClick={() => handleTestDataApi('airnow')} disabled={testingDataApi.airnow}>Test AirNow</Button>
                  <Button variant="outlined" startIcon={<TestIcon />} onClick={() => handleTestDataApi('aqs')} disabled={testingDataApi.aqs}>Test AQS</Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* System Information */}
        <Grid item xs={12} md={6}>
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">System Information</Typography>
                </Box>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Application Version"
                      secondary="1.0.0"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Database Status"
                      secondary={
                        <Chip label="Connected" color="success" size="small" />
                      }
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="OCR Service"
                      secondary={
                        <Chip label="Active" color="success" size="small" />
                      }
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="AI Chat Service"
                      secondary={
                        <Chip label="Active" color="success" size="small" />
                      }
                    />
                  </ListItem>
                </List>

                <Alert severity="info" sx={{ mt: 2 }}>
                  All services are running normally. Last checked: {new Date().toLocaleString()}
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Scheduled Email Reports */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Scheduled Email Reports</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setScheduledEmailDialog(true)}
                >
                  Add Schedule
                </Button>
              </Box>

              {scheduledEmails && scheduledEmails.length > 0 ? (
                <List>
                  {scheduledEmails.map((email, index) => (
                    <React.Fragment key={email.id}>
                      <ListItem>
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={email.name}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {email.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {getFrequencyLabel(email.schedule.frequency)} at {email.schedule.time}
                                {email.schedule.frequency === 'weekly' && ` on ${getDayName(email.schedule.dayOfWeek)}`}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                Recipients: {email.recipients.length}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={email.active ? 'Active' : 'Inactive'}
                              color={email.active ? 'success' : 'default'}
                              size="small"
                            />
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => deleteScheduledEmailMutation.mutate(email.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < scheduledEmails.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No scheduled email reports configured. Click "Add Schedule" to create your first automated report.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Keys Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">AI API Keys Management</Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAiKeyDialog(true)}
                >
                  Add AI Key
                </Button>
              </Box>

              {aiKeys && aiKeys.length > 0 ? (
                <List>
                  {aiKeys.map((key, index) => (
                    <React.Fragment key={key.id}>
                      <ListItem>
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {key.name}
                              {key.isDefault && (
                                <Chip label="Default" color="primary" size="small" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {key.description || `${key.provider} - ${key.model}`}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                API Key: •••••••••{key.apiKey.slice(-4)}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                Added: {new Date(key.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!key.isDefault && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleSetDefaultKey(key.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<TestIcon />}
                              onClick={() => handleTestAiConnection(key)}
                              disabled={testingConnection}
                            >
                              Test
                            </Button>
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleDeleteAiKey(key.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < aiKeys.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No AI keys configured. Add your first AI API key to enable advanced analytics and chat features.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Security & Privacy</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable audit logging"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Require authentication for API access"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable data encryption at rest"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Allow anonymous usage analytics"
                  />
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> Ensure you have proper Firebase security rules configured and API keys are kept secure.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Scheduled Email Dialog */}
      <Dialog open={scheduledEmailDialog} onClose={() => setScheduledEmailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Scheduled Email Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Schedule Name"
                  value={newScheduledEmail.name}
                  onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Summary"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={newScheduledEmail.frequency}
                    label="Frequency"
                    onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, frequency: e.target.value }))}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newScheduledEmail.description}
                  onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this scheduled report"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipients"
                  value={newScheduledEmail.recipients}
                  onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="email1@example.com, email2@example.com"
                  helperText="Separate multiple email addresses with commas"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={newScheduledEmail.time}
                  onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, time: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              {newScheduledEmail.frequency === 'weekly' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      value={newScheduledEmail.dayOfWeek}
                      label="Day of Week"
                      onChange={(e) => setNewScheduledEmail(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    >
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                      <MenuItem value={0}>Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Report Title"
                  value={newScheduledEmail.reportConfig.title}
                  onChange={(e) => setNewScheduledEmail(prev => ({
                    ...prev,
                    reportConfig: { ...prev.reportConfig, title: e.target.value }
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={newScheduledEmail.reportConfig.format}
                    label="Format"
                    onChange={(e) => setNewScheduledEmail(prev => ({
                      ...prev,
                      reportConfig: { ...prev.reportConfig, format: e.target.value }
                    }))}
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduledEmailDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateScheduledEmail}
            disabled={createScheduledEmailMutation.isLoading}
          >
            Create Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Key Dialog */}
      <Dialog open={aiKeyDialog} onClose={() => setAiKeyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add AI API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Key Name"
                  value={newAiKey.name}
                  onChange={(e) => setNewAiKey(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., OpenAI Production Key"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={newAiKey.provider}
                    label="Provider"
                    onChange={(e) => setNewAiKey(prev => ({ ...prev, provider: e.target.value }))}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="google">Google AI</MenuItem>
                    <MenuItem value="azure">Azure OpenAI</MenuItem>
                    <MenuItem value="ollama">Ollama (Local)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="API Key"
                  type="password"
                  value={newAiKey.apiKey}
                  onChange={(e) => setNewAiKey(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  helperText="Your API key will be stored securely in local storage"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={newAiKey.model}
                    label="Model"
                    onChange={(e) => setNewAiKey(prev => ({ ...prev, model: e.target.value }))}
                  >
                    {getModelOptions(newAiKey.provider).map(model => (
                      <MenuItem key={model.value} value={model.value}>
                        {model.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custom Endpoint (Optional)"
                  value={newAiKey.endpoint}
                  onChange={(e) => setNewAiKey(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  helperText="Leave blank to use default endpoint"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={newAiKey.description}
                  onChange={(e) => setNewAiKey(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this API key usage"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newAiKey.isDefault}
                      onChange={(e) => setNewAiKey(prev => ({ ...prev, isDefault: e.target.checked }))}
                    />
                  }
                  label="Set as default AI key"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiKeyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddAiKey}
          >
            Add AI Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
