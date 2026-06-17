import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, Paper, Link } from '@mui/material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      const origin = location.state?.from?.pathname || '/';
      navigate(origin);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212' }}>
      
      {/* Left Panel: Logo Image */}
      <Box 
        sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'flex' }, 
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: '#ffffff', // White background to match the logo
          p: 4
        }}
      >
        <img 
          src="/bmh-full-logo.jpg" 
          alt="BMH Logo" 
          style={{ maxWidth: '60%', maxHeight: '60%', objectFit: 'contain' }} 
        />
      </Box>

      {/* Right Panel: Login Form */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, #0a58ca 0%, #052c65 100%)', // Brand blue gradient
          color: 'white',
          p: 4
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          
          {/* Mobile Logo Fallback */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4, bgcolor: 'white', p: 2, borderRadius: 2 }}>
             <img src="/bmh-full-logo.jpg" alt="BMH Logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
          </Box>

          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#ffffff', opacity: 0.9, mb: 5 }}>
            Sign in to your BMH account
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <form onSubmit={handleSubmit}>
            <Typography variant="overline" sx={{ color: '#ffffff', fontWeight: 'bold' }}>USERNAME</Typography>
            <TextField
              fullWidth
              placeholder="Enter your username"
              variant="outlined"
              sx={{ 
                mb: 3, 
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                  '&.Mui-focused fieldset': { borderColor: '#e6602e' },
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 1)', opacity: 1 }
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Typography variant="overline" sx={{ color: '#ffffff', fontWeight: 'bold' }}>PASSWORD</Typography>
            <TextField
              fullWidth
              placeholder="••••••••"
              type="password"
              variant="outlined"
              sx={{ 
                mb: 1, 
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.8)' },
                  '&.Mui-focused fieldset': { borderColor: '#e6602e' },
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 1)', opacity: 1 }
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
              <Link href="#" underline="hover" sx={{ color: '#ffffff', opacity: 1, fontSize: '0.875rem' }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ 
                mb: 4, 
                bgcolor: '#e6602e', 
                color: 'white', 
                fontWeight: 'bold',
                textTransform: 'none',
                py: 1.5,
                fontSize: '1.1rem',
                boxShadow: '0 4px 14px rgba(230, 96, 46, 0.4)',
                '&:hover': { bgcolor: '#cc5528', boxShadow: '0 6px 20px rgba(230, 96, 46, 0.6)' } 
              }}
            >
              Sign In
            </Button>
            
            <Typography variant="caption" display="block" align="center" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Authorized BMH personnel only
            </Typography>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
