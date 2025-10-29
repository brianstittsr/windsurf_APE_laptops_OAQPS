import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Upload from './pages/Upload/Upload';
import Invoices from './pages/Invoices/Invoices';
import Analytics from './pages/Analytics/Analytics';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import OIDDirector from './pages/OIDDirector/OIDDirector';
import AirNowAqs from './pages/AirNowAqs/AirNowAqs';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Create Material-UI theme based on EPA Web Style Guide
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0071bc', light: '#4c96d7', dark: '#205493' },
    secondary: { main: '#2e8540', light: '#4aa564', dark: '#1d5a30' },
    background: { default: '#f1f1f1', paper: '#ffffff' },
    success: { main: '#2e8540' },
    warning: { main: '#fdb81e' },
    error: { main: '#e31c3d' },
    info: { main: '#02bfe7' },
    text: { primary: '#212121', secondary: '#5b616b' },
    epa: {
      blue: { primary: '#0071bc', dark: '#205493', darker: '#112e51', light: '#4c96d7', lighter: '#8bbee8', lightest: '#dce4ef' },
      green: { primary: '#2e8540', light: '#4aa564', lighter: '#94bfa2' },
      gold: '#fdb81e',
      red: '#e31c3d',
      gray: { dark: '#323a45', medium: '#5b616b', light: '#aeb0b5', lighter: '#d6d7d9', lightest: '#f1f1f1', white: '#ffffff' },
    },
  },
  typography: {
    fontFamily: '"Source Sans Pro", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Merriweather", "Georgia", serif' },
    h2: { fontFamily: '"Merriweather", "Georgia", serif' },
  },
  shape: { borderRadius: 0 },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/oid-director" element={<OIDDirector />} />
                  <Route path="/airnow-aqs" element={<AirNowAqs />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;