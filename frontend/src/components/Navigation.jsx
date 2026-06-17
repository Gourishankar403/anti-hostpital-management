import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(90deg, #0a58ca 0%, #052c65 100%)', borderBottom: '4px solid #e6602e', height: '80px', justifyContent: 'center' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Section: User Greeting */}
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {user && (
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
              Welcome, {user.name || user.username}
            </Typography>
          )}
        </Box>
        
        {/* Center Section: Title and Logo */}
        <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
          {imgError ? (
            <LocalFloristIcon sx={{ fontSize: 50, color: 'white' }} />
          ) : (
            <Box 
              component="img" 
              src="/logo.png" 
              alt="Logo" 
              sx={{ height: 50, width: 50, objectFit: 'contain', p: 0.5 }} 
              onError={() => setImgError(true)} 
            />
          )}
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
            BMH OPERATIONS PORTAL
          </Typography>
        </Box>

        {/* Right Section: Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 3, flex: 1 }}>

          <Button color="inherit" onClick={handleLogout} variant="outlined" sx={{ borderColor: 'white', borderWidth: 2, fontSize: '1.1rem', '&:hover': { borderWidth: 2 } }}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
