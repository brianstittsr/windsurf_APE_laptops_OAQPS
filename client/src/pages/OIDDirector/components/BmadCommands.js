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
import { Code as CodeIcon, Description as DescriptionIcon } from '@mui/icons-material';

const BmadCommands = () => {
  const commands = [
    { command: '/bmad-builder', description: 'Assists in building and refining BMAD agents.' },
    { command: '/bmad-master', description: 'Provides comprehensive guidance on the BMAD framework.' },
    { command: '/storyteller', description: 'Helps craft compelling narratives and stories.' },
    { command: '/ux-designer', description: 'Offers expertise in user experience and design.' },
    { command: '/dev', description: 'A general-purpose development assistant.' },
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CodeIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Assistant Commands</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        For brainstorming and brief generation.
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List dense>
        {commands.map((item, index) => (
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

export default BmadCommands;
