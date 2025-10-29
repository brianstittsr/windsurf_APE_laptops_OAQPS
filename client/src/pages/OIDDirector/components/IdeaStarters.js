import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import { HelpOutline as HelpOutlineIcon, Psychology as PsychologyIcon } from '@mui/icons-material';

const IdeaStarters = () => {
  const planningQuestions = [
    'Help me draft a project plan for a new public awareness campaign.',
    'What are the key milestones for a successful outreach initiative?',
    'Generate a list of potential risks for our upcoming data modernization project.',
    'List all available brainstorming and ideation services.',
  ];

  const scamperQuestions = [
    { q: 'Substitute: What if we replaced our current newsletter with a podcast?', a: 'SCAMPER' },
    { q: 'Combine: How can we combine our air quality data with public health statistics for a new report?', a: 'SCAMPER' },
    { q: 'Adapt: What ideas from the private sector can we adapt for government outreach?', a: 'SCAMPER' },
    { q: 'Modify: How can we modify our current website to be more user-friendly?', a: 'SCAMPER' },
    { q: 'Put to another use: Can our data analysis tools be used to support other divisions?', a: 'SCAMPER' },
    { q: 'Eliminate: What if we eliminated one step from our public comment process?', a: 'SCAMPER' },
    { q: 'Reverse: How could we reverse the way we currently handle information requests?', a: 'SCAMPER' },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PsychologyIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Idea Starters</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use these questions to brainstorm, plan, and explore new ideas with your assistant.
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List dense>
        {planningQuestions.map((text, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }}>
        <Typography variant="overline">SCAMPER Method</Typography>
      </Divider>
      <List dense>
        {scamperQuestions.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <HelpOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.q} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default IdeaStarters;
