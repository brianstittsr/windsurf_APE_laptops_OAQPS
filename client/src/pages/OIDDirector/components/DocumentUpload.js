import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const DocumentUpload = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Upload Documents</Typography>
      <Button variant="contained" component="label">
        Choose File
        <input type="file" hidden />
      </Button>
    </Box>
  );
};

export default DocumentUpload;
