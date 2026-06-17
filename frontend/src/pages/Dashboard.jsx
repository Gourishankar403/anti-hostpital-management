import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Snackbar, Alert, Card, CardContent, Grid, LinearProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, IconButton } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Sidebar from '../components/Sidebar';
import CreateRequest from '../components/CreateRequest';
import RequestDetailsModal from '../components/RequestDetailsModal';
import ITCompletionModal from '../components/ITCompletionModal';
import ApproveRejectModal from '../components/ApproveRejectModal';
import Audit from './Audit';
import Users from './Users';
import { useRequests } from '../contexts/RequestContext';
import { useStages } from '../contexts/StageContext';

const formatStatus = (req, user, stages) => {
  if (!req || !req.status) return 'UNKNOWN';

  // Contextual status for Stage 2 (Finance)
  if (user?.role === 'Stage 2') {
    if (req.stage2_status === 'PENDING') return `Pending ${stages[2]?.name || 'Stage 2'}`;
    if (req.stage2_status === 'APPROVED') return `Approved by ${stages[2]?.name || 'Stage 2'}`;
    if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'}`;
  }

  // Contextual status for Stage 3 (IT)
  if (user?.role === 'Stage 3') {
    if (req.status === 'PENDING_STAGE_2_AND_3') {
      if (req.stage2_status === 'APPROVED') return `Approved by ${stages[2]?.name || 'Stage 2'}`;
      if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'}`;
    }
  }

  // General fallback
  if (req.status === 'PENDING_STAGE_1') return `Pending ${stages[1]?.name || 'Stage 1'}`;
  if (req.status === 'PENDING_STAGE_2_AND_3') {
    if (req.stage2_status === 'APPROVED') return `Pending ${stages[3]?.name || 'Stage 3'}`;
    if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'} - Pending ${stages[3]?.name || 'Stage 3'}`;
    return `Pending ${stages[2]?.name || 'Stage 2'} & ${stages[3]?.name || 'Stage 3'}`;
  }
  if (req.status === 'PENDING_STAGE_3') return `Pending ${stages[3]?.name || 'Stage 3'} Action`;
  return req.status.replace(/_/g, ' ');
};

const SoftChip = ({ label, colorType }) => {
  const getStyle = () => {
    switch(colorType) {
      case 'success': return { bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold', border: '1px solid #c8e6c9' };
      case 'error': return { bgcolor: '#ffebee', color: '#c62828', fontWeight: 'bold', border: '1px solid #ffcdd2' };
      case 'warning': return { bgcolor: '#fff3e0', color: '#ef6c00', fontWeight: 'bold', border: '1px solid #ffe0b2' };
      default: return { fontWeight: 'bold' };
    }
  };
  return <Chip label={label} size="small" sx={getStyle()} />;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { stages } = useStages();
  const { requests, refreshRequests } = useRequests();
  const [currentView, setCurrentView] = useState('');
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [approveRejectModalOpen, setApproveRejectModalOpen] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(''); // 'APPROVED' or 'REJECTED'
  const [stageTarget, setStageTarget] = useState(1);
  
  // Notification state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Set default view based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'Department') setCurrentView('MY_REQUESTS');
      else if (user.role === 'Stage 1' || user.role === 'Stage 2') setCurrentView('PENDING');
      else if (user.role === 'Stage 3') setCurrentView('IT_PENDING_NEW_BILL');
      else if (user.role === 'Admin') setCurrentView('USERS');
      else setCurrentView('DASHBOARD');
    }
  }, [user]);

  const calculateDashboardCounts = () => {
    let pending = 0;
    let completed = 0;
    let pendingBreakdown = {};
    let completedBreakdown = {};

    completed = requests.filter(r => r.status === 'COMPLETED').length;
    requests.filter(r => r.status === 'COMPLETED').forEach(r => {
      pendingBreakdown[r.request_type] = pendingBreakdown[r.request_type] || { pending: 0, completed: 0 };
      pendingBreakdown[r.request_type].completed += 1;
    });

    const addPending = (req) => {
      if (req.status === 'COMPLETED' || req.status === 'REJECTED') return;
      pending++;
      pendingBreakdown[req.request_type] = pendingBreakdown[req.request_type] || { pending: 0, completed: 0 };
      pendingBreakdown[req.request_type].pending += 1;
    };

    if (user?.role === 'Stage 1') {
      requests.filter(r => r.status === 'PENDING_STAGE_1').forEach(addPending);
    } else if (user?.role === 'Stage 2') {
      requests.filter(r => r.stage1_status === 'APPROVED' && r.stage2_status === 'PENDING').forEach(addPending);
    } else if (user?.role === 'Stage 3') {
      requests.filter(r => (r.status === 'PENDING_STAGE_2_AND_3' || r.status === 'PENDING_STAGE_3') && !r.completed_date).forEach(addPending);
    } else if (user?.role === 'Department' || user?.role === 'Admin') {
      requests.filter(r => r.status === 'PENDING_STAGE_1' || (r.status === 'PENDING_STAGE_2_AND_3' && r.stage2_status === 'PENDING')).forEach(addPending);
    }
    
    return { pending, completed, pendingBreakdown };
  };

  const renderDashboardCards = () => {
    const { pending, completed, pendingBreakdown } = calculateDashboardCounts();

    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Card sx={{ flex: 1, bgcolor: 'error.main', color: 'white', boxShadow: 6, borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="h6" fontWeight="900" sx={{ opacity: 0.9 }}>Pending Requests</Typography>
              <Typography variant="h3" fontWeight="bold">{pending}</Typography>
              {Object.keys(pendingBreakdown).some(k => pendingBreakdown[k].pending > 0) && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)', textAlign: 'left' }}>
                  {Object.keys(pendingBreakdown).filter(k => pendingBreakdown[k].pending > 0).map(k => (
                    <Typography key={k} variant="body2" sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <span>{k.replace(/_/g, ' ')}:</span> <strong>{pendingBreakdown[k].pending}</strong>
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: 'success.main', color: 'white', boxShadow: 6, borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="h6" fontWeight="900" sx={{ opacity: 0.9 }}>Action Taken / Cleared</Typography>
              <Typography variant="h3" fontWeight="bold">{completed}</Typography>
              {Object.keys(pendingBreakdown).some(k => pendingBreakdown[k].completed > 0) && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.3)', textAlign: 'left' }}>
                  {Object.keys(pendingBreakdown).filter(k => pendingBreakdown[k].completed > 0).map(k => (
                    <Typography key={k} variant="body2" sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <span>{k.replace(/_/g, ' ')}:</span> <strong>{pendingBreakdown[k].completed}</strong>
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Paper sx={{ mt: 2, p: 3, borderRadius: 4, boxShadow: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2} color="primary">Recent Requests Tracker</Typography>
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Request ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '20%' }}>COO (Stage 1)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '20%' }}>Finance (Stage 2)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', width: '20%' }}>IT (Stage 3)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.slice(0, 10).map((req) => (
                  <TableRow key={req.id}>
                    <TableCell sx={{ fontWeight: '500' }}>{req.req_id}</TableCell>
                    <TableCell>{req.request_type.replace(/_/g, ' ')}</TableCell>
                    <TableCell align="center">
                      <SoftChip 
                        label={req.stage1_status === 'SKIPPED' ? 'Skipped' : req.stage1_status === 'APPROVED' ? 'Approved' : req.stage1_status === 'REJECTED' ? 'Rejected' : 'Pending'} 
                        colorType={req.stage1_status === 'SKIPPED' ? 'info' : req.stage1_status === 'APPROVED' ? 'success' : req.stage1_status === 'REJECTED' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <SoftChip 
                        label={req.stage2_status === 'SKIPPED' ? 'Skipped' : req.stage2_status === 'APPROVED' ? 'Approved' : req.stage2_status === 'REJECTED' ? 'Rejected' : (req.status === 'REJECTED' ? 'Cancelled' : 'Pending')} 
                        colorType={req.stage2_status === 'SKIPPED' ? 'info' : req.stage2_status === 'APPROVED' ? 'success' : (req.stage2_status === 'REJECTED' || req.status === 'REJECTED') ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <SoftChip 
                        label={req.completed_date ? 'Action Taken' : req.status === 'REJECTED' ? 'Cancelled' : 'Pending'} 
                        colorType={req.completed_date ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No requests found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>
    );
  };

  // No local fetch/polling needed anymore, Context handles it

  const handleAction = (req, type) => {
    setSelectedRequest(req);
    if (type === 'DETAILS') {
      setDetailModalOpen(true);
    } else if (type === 'COMPLETE') {
      setCompletionModalOpen(true);
    } else if (type === 'APPROVE' || type === 'REJECT') {
      setActionType(type === 'APPROVE' ? 'APPROVED' : 'REJECTED');
      setStageTarget(user.role === 'Stage 1' ? 1 : 2);
      setApproveRejectModalOpen(true);
    }
  };

  const onModalCloseAndRefresh = (message) => {
    setDetailModalOpen(false);
    setCompletionModalOpen(false);
    setApproveRejectModalOpen(false);
    refreshRequests();
    if (['NEW_BILL', 'BULK_UPLOAD', 'UPDATE_REQUEST', 'MAPPING_REQUEST'].includes(currentView)) {
      setCurrentView('MY_REQUESTS');
    }
    if (typeof message === 'string') {
      setSnackbar({ open: true, message, severity: 'success' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Filter Data based on currentView
  let filteredRequests = [];
  let showActions = { approve: false, reject: false, complete: false, details: true };
  
  if (currentView === 'MY_REQUESTS') {
    filteredRequests = requests;
  } else if (currentView === 'HISTORY') {
    filteredRequests = requests;
  } else if (currentView === 'PENDING' && user.role === 'Stage 1') {
    filteredRequests = requests.filter(r => r.status === 'PENDING_STAGE_1');
    showActions.approve = true;
    showActions.reject = true;
  } else if (currentView === 'APPROVED' && user.role === 'Stage 1') {
    filteredRequests = requests.filter(r => r.stage1_status === 'APPROVED');
  } else if (currentView === 'PENDING' && user.role === 'Stage 2') {
    filteredRequests = requests.filter(r => r.stage1_status === 'APPROVED' && r.stage2_status === 'PENDING');
    showActions.approve = true;
    showActions.reject = true;
  } else if (currentView === 'REVIEWED' && user.role === 'Stage 2') {
    filteredRequests = requests.filter(r => r.stage1_status === 'APPROVED' && r.stage2_status !== 'PENDING');
  } else if (user.role === 'Stage 3') {
    const pendingIt = requests.filter(r => (r.status === 'PENDING_STAGE_2_AND_3' || r.status === 'PENDING_STAGE_3') && !r.completed_date);
    if (currentView === 'IT_PENDING_NEW_BILL') {
      filteredRequests = pendingIt.filter(r => r.request_type === 'NEW_BILL');
      showActions.complete = true;
    } else if (currentView === 'IT_PENDING_BULK') {
      filteredRequests = pendingIt.filter(r => r.request_type === 'BULK_UPLOAD');
      showActions.complete = true;
    } else if (currentView === 'IT_PENDING_MAPPING') {
      filteredRequests = pendingIt.filter(r => r.request_type === 'MAPPING_REQUEST');
      showActions.complete = true;
    } else if (currentView === 'IT_PENDING_UPDATE') {
      filteredRequests = pendingIt.filter(r => r.request_type === 'RATE_UPDATE' || r.request_type === 'DESCRIPTION_UPDATE' || r.request_type === 'RATE_AND_DESCRIPTION_UPDATE');
      showActions.complete = true;
    } else if (currentView === 'IT_COMPLETED') {
      filteredRequests = requests.filter(r => r.completed_date != null);
    }
  }

  const renderTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Request ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Requested Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Request Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Requested By</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              {currentView === 'HISTORY' && (
                <>
                  <TableCell sx={{ fontWeight: 'bold' }}>Action Taken Date</TableCell>
                </>
              )}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={currentView === 'HISTORY' ? 7 : 6} align="center">No requests found.</TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.req_id}</TableCell>
                  <TableCell>{new Date(req.requested_date).toLocaleDateString()}</TableCell>
                  <TableCell>{req.request_type}</TableCell>
                  <TableCell>{req.requested_by?.name || req.department}</TableCell>
                  <TableCell>
                    <SoftChip 
                      label={formatStatus(req, user, stages)} 
                      colorType={
                        req.status === 'COMPLETED' && user?.role !== 'Stage 2' ? 'success' : 
                        req.stage2_status === 'APPROVED' && (user?.role === 'Stage 2' || user?.role === 'Stage 3') ? 'success' :
                        req.status === 'REJECTED' ? 'error' : 'warning'
                      } 
                    />
                  </TableCell>
                  {currentView === 'HISTORY' && (
                    <>
                      <TableCell>
                        {req.completed_date ? new Date(req.completed_date).toLocaleDateString() : 
                         req.stage2_date ? new Date(req.stage2_date).toLocaleDateString() : 
                         req.stage1_date ? new Date(req.stage1_date).toLocaleDateString() : '-'}
                      </TableCell>
                    </>
                  )}
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Button variant="outlined" size="small" onClick={() => handleAction(req, 'DETAILS')}>Details</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <Box sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 260px)` } }}>
        <Typography variant="h5" color="primary" fontWeight="bold" mb={3} sx={{ textTransform: 'uppercase' }}>
          {currentView.replace(/_/g, ' ')}
        </Typography>

        {currentView === 'DASHBOARD' ? (
          renderDashboardCards()
        ) : ['NEW_BILL', 'BULK_UPLOAD', 'UPDATE_REQUEST', 'MAPPING_REQUEST'].includes(currentView) ? (
          <CreateRequest 
            requestType={currentView} 
            onSuccess={(msg) => onModalCloseAndRefresh(msg)} 
            onCancel={() => setCurrentView('DASHBOARD')} 
          />
        ) : currentView === 'AUDIT' ? (
          <Audit />
        ) : currentView === 'USERS' ? (
          <Users onSuccess={(msg) => onModalCloseAndRefresh(msg)} />
        ) : (
          renderTable()
        )}
      </Box>

      {/* Modals */}
      <RequestDetailsModal 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        request={selectedRequest} 
        showActions={showActions}
        onAction={handleAction}
      />
      <ITCompletionModal 
        open={completionModalOpen} 
        onClose={() => setCompletionModalOpen(false)} 
        request={selectedRequest} 
        onComplete={(msg) => onModalCloseAndRefresh(msg)} 
      />
      <ApproveRejectModal 
        open={approveRejectModalOpen} 
        onClose={() => setApproveRejectModalOpen(false)} 
        request={selectedRequest} 
        actionType={actionType}
        stage={stageTarget}
        onComplete={(msg) => onModalCloseAndRefresh(msg)}
      />

      {/* Global Success Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: '50% !important', transform: 'translateY(-50%)' }}
      >
        <Alert onClose={handleSnackbarClose} icon={false} sx={{ width: '100%', fontSize: '1.1rem', bgcolor: 'primary.main', color: 'white' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
