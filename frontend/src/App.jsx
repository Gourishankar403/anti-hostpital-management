import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StageProvider } from './contexts/StageContext';
import { DialogProvider } from './contexts/DialogContext';
import { RequestProvider } from './contexts/RequestContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Navigation from './components/Navigation';
import { Box, CircularProgress, Toolbar } from '@mui/material';

import RequestDetailsPage from './pages/RequestDetailsPage';

import { useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireAdmin && user.role !== 'Admin') return <Navigate to="/" />;
  return (
    <Box sx={{ display: 'flex' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Toolbar sx={{ minHeight: '84px' }} /> {/* Spacer matching AppBar height */}
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <StageProvider>
          <DialogProvider>
            <RequestProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/request/:id" element={<ProtectedRoute><RequestDetailsPage /></ProtectedRoute>} />
                </Routes>
              </Router>
            </RequestProvider>
          </DialogProvider>
        </StageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
