import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box
} from '@mui/material';
import { GetApp as GetAppIcon } from '@mui/icons-material';

const ReportGenerator = ({ reports }) => {
  const handleDownload = (report) => {
    // In a real application, this would trigger a file download.
    // For now, we'll just log the report to the console.
    console.log('Downloading report:', report);
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6">Generated Reports</Typography>
      <List dense>
        {reports.map((report, index) => (
          <ListItem key={index} secondaryAction={
            <IconButton edge="end" aria-label="download" onClick={() => handleDownload(report)}>
              <GetAppIcon />
            </IconButton>
          }>
            <ListItemText primary={report.title} secondary={`Generated on ${report.date}`} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default ReportGenerator;
