import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
} from '@mui/material';

// EPA Footer component following EPA Web Style Guide
const EPAFooter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const footerColumns = [
    {
      title: 'Discover',
      links: [
        { title: 'Accessibility', url: '#' },
        { title: 'Budget & Performance', url: '#' },
        { title: 'Contracting', url: '#' },
        { title: 'Grants', url: '#' },
        { title: 'EPA www Web Snapshot', url: '#' },
        { title: 'No FEAR Act Data', url: '#' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { title: 'Data', url: '#' },
        { title: 'Media', url: '#' },
        { title: 'News', url: '#' },
        { title: 'Social Media', url: '#' },
        { title: 'Mobile', url: '#' },
      ],
    },
    {
      title: 'Ask',
      links: [
        { title: 'Contact EPA', url: '#' },
        { title: 'Hotlines', url: '#' },
        { title: 'FOIA Requests', url: '#' },
        { title: 'Frequent Questions', url: '#' },
      ],
    },
    {
      title: 'Follow',
      links: [
        { title: 'Facebook', url: '#' },
        { title: 'Twitter', url: '#' },
        { title: 'YouTube', url: '#' },
        { title: 'Instagram', url: '#' },
        { title: 'Flickr', url: '#' },
      ],
    },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: theme.palette.epa.gray.lightest, pt: 4, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {footerColumns.map((column, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.epa.blue.dark,
                  mb: 2,
                  fontSize: '1rem',
                }}
              >
                {column.title}
              </Typography>
              <List dense disablePadding>
                {column.links.map((link, linkIndex) => (
                  <ListItem key={linkIndex} disablePadding sx={{ mb: 0.5 }}>
                    <Link
                      href={link.url}
                      underline="hover"
                      sx={{
                        color: theme.palette.epa.blue.primary,
                        fontSize: '0.9rem',
                      }}
                    >
                      {link.title}
                    </Link>
                  </ListItem>
                ))}
              </List>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2} sx={{ py: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
              <Link href="#" underline="hover" sx={{ color: theme.palette.epa.blue.primary }}>
                Privacy and Security Notice
              </Link>
              <Link href="#" underline="hover" sx={{ color: theme.palette.epa.blue.primary }}>
                Accessibility
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" align={isMobile ? 'left' : 'right'}>
              © {new Date().getFullYear()} United States Environmental Protection Agency
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EPAFooter;
