import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Box, Chip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useRequests } from '../contexts/RequestContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HistoryIcon from '@mui/icons-material/History';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RuleIcon from '@mui/icons-material/Rule';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';

const drawerWidth = 260; // Increased width slightly to accommodate icons

const Sidebar = ({ currentView, onViewChange }) => {
  const { user } = useAuth();
  const { requests } = useRequests();
  
  if (!user) return null;

  let menuItems = [];

  const getPendingCount = (id) => {
    if (!requests) return 0;
    const activeRequests = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED');
    
    if (user.role === 'Stage 1' && id === 'PENDING') {
      return activeRequests.filter(r => r.status === 'PENDING_STAGE_1').length;
    }
    if (user.role === 'Stage 2' && id === 'PENDING') {
      return activeRequests.filter(r => r.stage1_status === 'APPROVED' && r.stage2_status === 'PENDING').length;
    }
    if (user.role === 'Stage 3') {
      const itPending = activeRequests.filter(r => (r.status === 'PENDING_STAGE_2_AND_3' || r.status === 'PENDING_STAGE_3') && !r.completed_date);
      if (id === 'IT_PENDING_NEW_BILL') return itPending.filter(r => r.request_type === 'NEW_BILL').length;
      if (id === 'IT_PENDING_BULK') return itPending.filter(r => r.request_type === 'BULK_UPLOAD').length;
      if (id === 'IT_PENDING_MAPPING') return itPending.filter(r => r.request_type === 'MAPPING_REQUEST').length;
      if (id === 'IT_PENDING_UPDATE') return itPending.filter(r => ['RATE_UPDATE', 'DESCRIPTION_UPDATE', 'RATE_AND_DESCRIPTION_UPDATE'].includes(r.request_type)).length;
    }
    return 0;
  };

  if (user.role === 'Department') {
    menuItems = [
      { id: 'NEW_BILL', label: 'New Bill Request', icon: <AddCircleOutlinedIcon /> },
      { id: 'BULK_UPLOAD', label: 'Bulk Upload', icon: <CloudUploadIcon /> },
      { id: 'UPDATE_REQUEST', label: 'Rate / Desc Update', icon: <EditNoteIcon /> },
      { id: 'MAPPING_REQUEST', label: 'Mapping Request', icon: <MergeTypeIcon /> },
      { id: 'MY_REQUESTS', label: 'My Requests', icon: <ListAltIcon /> },
      { id: 'HISTORY', label: 'History', icon: <HistoryIcon /> }
    ];
  } else if (user.role === 'Stage 1') { // COO
    menuItems = [
      { id: 'PENDING', label: 'Pending Requests', icon: <PendingActionsIcon /> },
      { id: 'APPROVED', label: 'Approved Requests', icon: <CheckCircleOutlinedIcon /> },
      { id: 'HISTORY', label: 'History', icon: <HistoryIcon /> }
    ];
  } else if (user.role === 'Stage 2') { // Finance
    menuItems = [
      { id: 'PENDING', label: 'Pending Approvals', icon: <PendingActionsIcon /> },
      { id: 'REVIEWED', label: 'Approved Requests', icon: <CheckCircleOutlinedIcon /> },
      { id: 'HISTORY', label: 'History', icon: <HistoryIcon /> }
    ];
  } else if (user.role === 'Stage 3') { // IT
    menuItems = [
      { id: 'IT_PENDING_NEW_BILL', label: 'Pending New Bill', icon: <AddCircleOutlinedIcon /> },
      { id: 'IT_PENDING_BULK', label: 'Pending Bulk', icon: <CloudUploadIcon /> },
      { id: 'IT_PENDING_MAPPING', label: 'Pending Mapping', icon: <MergeTypeIcon /> },
      { id: 'IT_PENDING_UPDATE', label: 'Pending Updates', icon: <EditNoteIcon /> },
      { id: 'IT_COMPLETED', label: 'Completed', icon: <PlaylistAddCheckIcon /> },
      { id: 'AUDIT', label: 'Audit Logs', icon: <SecurityIcon /> }
    ];
  } else if (user.role === 'Admin') {
    menuItems = [
      { id: 'USERS', label: 'Users & Roles', icon: <PeopleIcon /> },
      { id: 'HISTORY', label: 'All History', icon: <HistoryIcon /> },
      { id: 'AUDIT', label: 'Audit Logs', icon: <SecurityIcon /> }
    ];
  }

  // Prepend Dashboard to all users
  menuItems.unshift({ id: 'DASHBOARD', label: 'Dashboard', icon: <DashboardIcon /> });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0a58ca 0%, #052c65 100%)', // Subtle gradient
          color: 'white',
          marginTop: '84px', // Push below AppBar (80px height + 4px border)
          height: 'calc(100% - 84px)', // Adjust height
          borderRight: '4px solid #e6602e', // Thicker orange border matching theme
          borderTopRightRadius: '24px', // Rounded top right edge
          borderBottomRightRadius: '24px', // Rounded bottom right edge
          boxShadow: '4px 0 15px rgba(0,0,0,0.1)'
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton 
                selected={currentView === item.id}
                onClick={() => onViewChange(item.id)}
                sx={{
                  py: 1.5,
                  mb: 0.5,
                  borderRadius: '12px',
                  margin: '0 12px',
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    backgroundColor: '#ffffff',
                    color: '#0a58ca',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: currentView === item.id ? '#0a58ca' : 'white', minWidth: 40, transition: 'color 0.3s ease' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: currentView === item.id ? 'bold' : '500',
                    fontSize: '1.15rem',
                    letterSpacing: '0.3px'
                  }}
                />
                {getPendingCount(item.id) > 0 && (
                  <Chip 
                    label={getPendingCount(item.id)} 
                    size="small" 
                    color="error" 
                    sx={{ 
                      height: 22, 
                      minWidth: 22, 
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      ml: 1
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
