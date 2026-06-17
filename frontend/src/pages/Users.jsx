import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Switch, TextField, Grid, MenuItem } from '@mui/material';
import api from '../api';
import { useStages } from '../contexts/StageContext';
import { useDialog } from '../contexts/DialogContext';

const Users = ({ onSuccess }) => {
  const { stages, fetchStages } = useStages();
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'Department', department: '' });
  const [smtpConfig, setSmtpConfig] = useState({ smtp_user: '', smtp_password: '' });
  const [localStages, setLocalStages] = useState({});

  useEffect(() => {
    if (stages && Object.keys(stages).length > 0) {
      setLocalStages(stages);
    }
  }, [stages]);

  useEffect(() => {
    fetchUsers();
    fetchStages();
    fetchSmtpConfig();
  }, []);

  const fetchSmtpConfig = async () => {
    try {
      const res = await api.get('/config/smtp');
      setSmtpConfig({ smtp_user: res.data.smtp_user, smtp_password: '' });
    } catch (err) { console.error("Failed to fetch SMTP config", err); }
  };

  const handleSaveSmtpConfig = async () => {
    try {
      await api.post('/config/smtp', smtpConfig);
      if (onSuccess) onSuccess('Successfully updated global SMTP settings!');
    } catch (err) { showAlert('Failed to update SMTP settings', 'Error'); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/');
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };



  const handleCreateUser = async () => {
    try {
      await api.post('/users/', newUser);
      fetchUsers();
      setNewUser({ username: '', password: '', name: '', email: '', role: 'Department', department: '' });
      if (onSuccess) onSuccess('Successfully created user!');
    } catch (err) { showAlert('Failed to create user', 'Error'); }
  };

  const toggleUserActive = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { ...user, active: !user.active });
      fetchUsers();
      if (onSuccess) onSuccess(`Successfully ${user.active ? 'deactivated' : 'activated'} user!`);
    } catch (err) { showAlert('Failed to update user', 'Error'); }
  };

  const handleDeleteUser = (userId) => {
    showConfirm('Are you sure you want to delete this user?', 'Confirm Deletion', async () => {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
        if (onSuccess) onSuccess('Successfully deleted user!');
      } catch (err) { showAlert('Failed to delete user', 'Error'); }
    });
  };

  const handleDeleteAllRequests = () => {
    showConfirm('WARNING: Are you absolutely sure you want to delete ALL requests, audit logs, and email logs? This action CANNOT be undone.', 'Warning', async () => {
      try {
        await api.delete('/requests/all');
        if (onSuccess) onSuccess('Successfully wiped all request data!');
      } catch (err) { showAlert('Failed to delete requests', 'Error'); }
    });
  };

  const handleSaveStages = async () => {
    try {
      const promises = Object.entries(localStages).map(([stageNum, stage]) => {
        const stageId = stage.id || stages[stageNum]?.id || parseInt(stageNum);
        if (stages[stageNum] && stages[stageNum].name !== stage.name) {
          return api.put(`/stages/${stageId}`, { stage_number: parseInt(stageNum), name: stage.name });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      fetchStages(); // Refresh global stages
      if (onSuccess) onSuccess('Successfully renamed stages!');
    } catch (err) { showAlert('Failed to rename stages', 'Error'); }
  };

  return (
    <Box>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Dynamic Workflow Stages</Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>Rename stages without changing code. Applies globally.</Typography>
            {Object.entries(localStages).map(([stageNum, stage]) => (
              <Box key={stage.id || stageNum} display="flex" alignItems="center" gap={2} mb={2}>
                <Typography>Stage {stage.stage_number || stageNum}:</Typography>
                <TextField 
                  size="small" 
                  value={stage.name || ''}
                  onChange={(e) => setLocalStages(prev => ({ ...prev, [stageNum]: { ...prev[stageNum], name: e.target.value } }))}
                />
              </Box>
            ))}
            <Button variant="contained" color="primary" onClick={handleSaveStages} fullWidth sx={{ mt: 1 }}>Save Changes</Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Create User</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField size="small" fullWidth label="Username" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} /></Grid>
              <Grid item xs={6}><TextField size="small" fullWidth type="password" label="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></Grid>
              <Grid item xs={6}>
                <TextField select size="small" fullWidth label="Role" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <MenuItem value="Department">Department</MenuItem>
                  <MenuItem value="Stage 1">Stage 1 ({stages[1]?.name || 'COO'})</MenuItem>
                  <MenuItem value="Stage 2">Stage 2 ({stages[2]?.name || 'Finance'})</MenuItem>
                  <MenuItem value="Stage 3">Stage 3 ({stages[3]?.name || 'IT'})</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Button variant="contained" onClick={handleCreateUser} fullWidth sx={{ height: '100%' }}>Add User</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>System Configuration</Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>Global No-Reply Email Settings.</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Global From Email" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth type="password" label="Gmail App Password" value={smtpConfig.smtp_password} onChange={e => setSmtpConfig({...smtpConfig, smtp_password: e.target.value})} placeholder="16-character app password" />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" onClick={handleSaveSmtpConfig} fullWidth>Save Global Settings</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="error">Data Management</Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>Wipe the database cleanly for fresh testing.</Typography>
            <Button variant="contained" color="error" fullWidth sx={{ mt: 2 }} onClick={handleDeleteAllRequests}>
              DELETE ALL REQUESTS
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Manage Users</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Switch checked={u.active} onChange={() => toggleUserActive(u)} disabled={u.username === 'admin'} />
                  </TableCell>
                  <TableCell>
                    {u.username !== 'admin' && (
                      <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteUser(u.id)}>
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Users;
