import React from 'react';
import { Box, Container, Grid as MuiGrid, styled } from '@mui/material';

// EPA Grid component following EPA Web Style Guide
// This component provides consistent grid layout according to EPA standards

// Styled components for EPA grid system
const EPAContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
  maxWidth: '1200px', // EPA standard max width
}));

const EPARow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  margin: theme.spacing(-2), // Negative margin to offset column padding
}));

const EPAColumn = styled(Box)(({ theme, span = 12 }) => ({
  padding: theme.spacing(2),
  width: `${(span / 12) * 100}%`,
  [theme.breakpoints.down('md')]: {
    width: '100%', // Full width on mobile
  },
}));

// EPA Grid components
export const EPAGrid = ({ children, ...props }) => {
  return <MuiGrid container spacing={3} {...props}>{children}</MuiGrid>;
};

export const EPAGridItem = ({ children, ...props }) => {
  return <MuiGrid item {...props}>{children}</MuiGrid>;
};

// EPA Section component for consistent section spacing
export const EPASection = ({ children, backgroundColor, ...props }) => {
  return (
    <Box 
      component="section" 
      sx={{ 
        py: { xs: 3, md: 4 },
        backgroundColor: backgroundColor || 'transparent',
        mb: 3, // Add margin bottom for spacing between sections
        ...props.sx
      }}
      {...props}
    >
      {/* Use Container for content but with higher max-width to match existing layout */}
      <Container maxWidth="xl">
        {children}
      </Container>
    </Box>
  );
};

// EPA Page component for consistent page layout
export const EPAPage = ({ children, title, ...props }) => {
  return (
    <Box 
      component="main" 
      sx={{ 
        py: { xs: 2, md: 3 },
        px: { xs: 2, md: 3 },
        ...props.sx
      }}
      {...props}
    >
      {/* No Container wrapper to allow for full-width content */}
      {children}
    </Box>
  );
};

const EPAGridComponents = {
  EPAGrid,
  EPAGridItem,
  EPASection,
  EPAPage,
  EPAContainer,
  EPARow,
  EPAColumn
};

export default EPAGridComponents;
