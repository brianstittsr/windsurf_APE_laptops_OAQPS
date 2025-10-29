import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Link,
  Container,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';

// EPA Header component following EPA Web Style Guide
const EPAHeader = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const topNavLinks = [
    { title: 'Contact Us', url: '#' },
    { title: 'About EPA', url: '#' },
    { title: 'Accessibility', url: '#' },
    { title: 'Privacy', url: '#' },
    { title: 'Privacy and Security Notice', url: '#' },
  ];

  const mainNavLinks = [
    { title: 'Environmental Topics', url: '#' },
    { title: 'Laws & Regulations', url: '#' },
    { title: 'Report a Violation', url: '#' },
    { title: 'About EPA', url: '#' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Banner - Dark Blue */}
      <AppBar position="static" sx={{ bgcolor: theme.palette.epa.blue.darker, boxShadow: 'none' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 36, py: 0 }}>
            <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
              An official website of the United States government
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Top Navigation - White */}
      <AppBar position="static" sx={{ bgcolor: 'white', color: theme.palette.text.primary, boxShadow: 'none' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 40 }}>
            {/* EPA Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.epa.blue.primary,
                  fontSize: isMobile ? '1.2rem' : '1.5rem',
                  mr: 1
                }}
              >
                EPA
              </Typography>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 400, 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '1.5rem'
                }}
              >
                United States Environmental Protection Agency
              </Typography>
            </Box>

            {/* Top Nav Links - Desktop */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {topNavLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    href={link.url} 
                    underline="hover" 
                    sx={{ 
                      color: theme.palette.text.primary, 
                      fontSize: '0.8rem',
                      '&:hover': { color: theme.palette.primary.main }
                    }}
                  >
                    {link.title}
                  </Link>
                ))}
              </Box>
            )}

            {/* Mobile Menu */}
            {isMobile && (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMobileMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={mobileMenuAnchor}
                  open={Boolean(mobileMenuAnchor)}
                  onClose={handleMobileMenuClose}
                  sx={{ mt: 1 }}
                >
                  {[...mainNavLinks, ...topNavLinks].map((link, index) => (
                    <MenuItem key={index} onClick={handleMobileMenuClose}>
                      <Link 
                        href={link.url} 
                        underline="none" 
                        sx={{ color: 'inherit' }}
                      >
                        {link.title}
                      </Link>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Navigation - Blue */}
      {!isMobile && (
        <AppBar position="static" sx={{ bgcolor: theme.palette.primary.main, boxShadow: 'none' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ minHeight: 50 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                {mainNavLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    href={link.url} 
                    underline="none" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '1rem',
                      '&:hover': { 
                        color: 'white',
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {link.title}
                  </Link>
                ))}
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <IconButton color="inherit" aria-label="search">
                <SearchIcon />
              </IconButton>
            </Toolbar>
          </Container>
        </AppBar>
      )}

      {/* Page Title - Light Gray */}
      <Box sx={{ bgcolor: theme.palette.epa.gray.lightest, py: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: theme.palette.epa.blue.dark }}>
            EPA OID Planning and Management Tool
          </Typography>
        </Container>
      </Box>

      <Divider />
    </Box>
  );
};

export default EPAHeader;
