import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  Divider,
  Link,
  CircularProgress,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import { useAuth } from '../../context/AuthContext';
import LoginGovIcon from '@mui/icons-material/AccountBalanceOutlined';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoginGovLoading, setIsLoginGovLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login, loginWithLoginGov, currentUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(location.state?.from || '/dashboard');
    }
  }, [currentUser, navigate, location]);

  // Handle login.gov redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code && state) {
      // In a real implementation, we would exchange the code for a token
      // For demo purposes, we'll simulate a successful login.gov authentication
      setIsLoginGovLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockTokenResponse = {
          sub: 'login-gov-user-id',
          email: 'user@login.gov',
          name: 'Login.gov User'
        };
        
        loginWithLoginGov(mockTokenResponse);
        setIsLoginGovLoading(false);
        navigate('/dashboard');
      }, 1500);
    }
  }, [loginWithLoginGov, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleLoginGov = () => {
    // In a real implementation, this would redirect to login.gov
    // For demo purposes, we'll simulate the OAuth flow
    setIsLoginGovLoading(true);
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('login_gov_state', state);
    
    // Simulate redirect to login.gov
    setTimeout(() => {
      // In a real implementation, this would be the actual login.gov URL
      // window.location.href = `https://secure.login.gov/openid_connect/authorize?client_id=your_client_id&response_type=code&scope=openid+email&redirect_uri=${encodeURIComponent(window.location.origin + '/login')}&state=${state}`;
      
      // For demo, we'll simulate the redirect back from login.gov
      window.location.href = `/login?code=demo_auth_code&state=${state}`;
    }, 500);
  };

  return (
    <Container component="main" maxWidth="md">
      <Box 
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* EPA Warning Banner */}
        <Box sx={{ width: '100%', mb: 3 }} role="region" aria-label="EPA Warning Notice">
          <div style={{ backgroundColor: '#1a4480', color: 'white', padding: '10px', textAlign: 'center', width: '100%' }}>
            <h3 id="warning-heading">EPA WARNING NOTICE</h3>
            <p>This is a United States Environmental Protection Agency (EPA) computer system, which may be accessed and used only by individuals explicitly authorized by EPA. Unauthorized access or use may subject violators to criminal, civil, and/or administrative action.</p>
            <p>All information on this system may be intercepted, recorded, read, copied, and disclosed by and to authorized personnel for official purposes, including criminal investigations. Such information includes sensitive data encrypted to comply with confidentiality and privacy requirements. Access or use of this computer system indicates consent to these terms.</p>
          </div>
        </Box>

        {/* EPA Logo */}
        <Box sx={{ mb: 2 }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '24px', color: '#1a4480' }}>
            U.S. Environmental Protection Agency
          </div>
        </Box>

        <Paper 
          elevation={1} 
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid #d6d7d9',
            borderRadius: 0
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: theme.palette.epa.blue.primary, borderRadius: 0 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ color: theme.palette.epa.blue.dark, fontWeight: 700 }} id="login-heading">
            EPA Invoice Analytics Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, textAlign: 'center' }}>
            This is an official EPA system. Authorized users only.
          </Typography>
          
          <Divider sx={{ width: '100%', mb: 3 }} />
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }} aria-labelledby="login-heading">
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn || isLoginGovLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.epa.blue.primary,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.epa.blue.primary,
                },
              }}
              InputProps={{
                sx: { borderRadius: 0 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn || isLoginGovLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 0,
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.epa.blue.primary,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: theme.palette.epa.blue.primary,
                },
              }}
              InputProps={{
                sx: { borderRadius: 0 }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                bgcolor: theme.palette.epa.blue.primary,
                '&:hover': {
                  bgcolor: theme.palette.epa.blue.dark,
                },
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5
              }}
              disabled={isLoggingIn || isLoginGovLoading}
              aria-live="polite"
            >
              {isLoggingIn ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LoginGovIcon />}
              onClick={handleLoginGov}
              disabled={isLoggingIn || isLoginGovLoading}
              sx={{ 
                mb: 2,
                borderColor: theme.palette.epa.blue.primary,
                color: theme.palette.epa.blue.primary,
                '&:hover': {
                  borderColor: theme.palette.epa.blue.dark,
                  color: theme.palette.epa.blue.dark,
                  bgcolor: 'rgba(0, 113, 188, 0.05)',
                },
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5
              }}
              aria-live="polite"
            >
              {isLoginGovLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Login.gov'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            For assistance, contact the EPA Help Desk at 866-411-4EPA (4372)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            © {new Date().getFullYear()} United States Environmental Protection Agency
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
