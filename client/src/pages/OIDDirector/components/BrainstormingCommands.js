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
import { Psychology as PsychologyIcon, Description as DescriptionIcon } from '@mui/icons-material';

const BrainstormingCommands = () => {
  const techniques = [
    { command: '/scamper', description: 'Use action verbs (Substitute, Combine, Adapt, etc.) to prompt new ideas.' },
    { command: '/reverse-brainstorming', description: 'Focus on creating problems and then solve them.' },
    { command: '/starbursting', description: 'Generate questions about a topic rather than answers.' },
    { command: '/mind-mapping', description: 'Visually organize information around a central concept.' },
    { command: '/round-robin', description: 'Go around in a group and have each person share an idea.' },
    { command: '/rapid-ideation', description: 'Generate a large number of ideas in a short period.' },
    { command: '/figure-storming', description: 'Imagine how a well-known figure would handle a problem.' },
    { command: '/swot-analysis', description: 'Identify Strengths, Weaknesses, Opportunities, and Threats.' },
    { command: '/five-whys', description: 'Ask \'Why?\' five times to get to the root cause of a problem.' },
    { command: '/brainwriting', description: 'Write down ideas and pass them around for others to build upon.' },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PsychologyIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Brainstorming Techniques</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Use these slash commands to start a guided brainstorming session.
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List dense>
        {techniques.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.command} secondary={item.description} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default BrainstormingCommands;
