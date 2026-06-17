import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress, Chip, Button, Divider, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useStages } from '../contexts/StageContext';
import ITCompletionModal from '../components/ITCompletionModal';
import ApproveRejectModal from '../components/ApproveRejectModal';

const formatStatus = (req, user, stages) => {
  if (!req || !req.status) return 'UNKNOWN';
  if (user?.role === 'Stage 2') {
    if (req.stage2_status === 'PENDING') return `Pending ${stages[2]?.name || 'Stage 2'}`;
    if (req.stage2_status === 'APPROVED') return `Approved by ${stages[2]?.name || 'Stage 2'}`;
    if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'}`;
  }
  if (user?.role === 'Stage 3') {
    if (req.status === 'PENDING_STAGE_2_AND_3') {
      if (req.stage2_status === 'APPROVED') return `Approved by ${stages[2]?.name || 'Stage 2'}`;
      if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'}`;
    }
  }
  if (req.status === 'PENDING_STAGE_1') return `Pending ${stages[1]?.name || 'Stage 1'}`;
  if (req.status === 'PENDING_STAGE_2_AND_3') {
    if (req.stage2_status === 'APPROVED') return `Pending ${stages[3]?.name || 'Stage 3'}`;
    if (req.stage2_status === 'REJECTED') return `Rejected by ${stages[2]?.name || 'Stage 2'} - Pending ${stages[3]?.name || 'Stage 3'}`;
    return `Pending ${stages[2]?.name || 'Stage 2'} & ${stages[3]?.name || 'Stage 3'}`;
  }
  if (req.status === 'PENDING_STAGE_3') {
    return `Pending ${stages[3]?.name || 'Stage 3'}`;
  }
  return req.status.replace(/_/g, ' ');
};

const RequestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stages } = useStages();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [approveRejectModalOpen, setApproveRejectModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [stageTarget, setStageTarget] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const cleanId = id.replace(/ /g, '-').replace(/%20/g, '-');
        const response = await api.get(`/requests/id/${cleanId}`);
        setRequest(response.data);
      } catch (err) {
        setError(`Error loading request: ${err.response?.data?.detail || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequest();
    
    const intervalId = setInterval(() => {
      fetchRequest();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [id]);

  const handleAction = (req, type) => {
    if (type === 'COMPLETE') {
      setCompletionModalOpen(true);
    } else if (type === 'APPROVE' || type === 'REJECT') {
      setActionType(type === 'APPROVE' ? 'APPROVED' : 'REJECTED');
      setStageTarget(user?.role === 'Stage 1' ? 1 : 2);
      setApproveRejectModalOpen(true);
    }
  };

  const onModalCloseAndRefresh = async (message) => {
    setCompletionModalOpen(false);
    setApproveRejectModalOpen(false);
    if (message) {
      setSnackbar({ open: true, message, severity: 'success' });
      try {
        const cleanId = id.replace(/ /g, '-').replace(/%20/g, '-');
        const response = await api.get(`/requests/id/${cleanId}`);
        setRequest(response.data);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: `Failed to process action: ${err.response?.data?.detail || err.message}`, severity: 'error' });
      }
    }
  };

  let showActions = { approve: false, reject: false, complete: false };
  if (request) {
    if (user?.role === 'Stage 1' && request.status === 'PENDING_STAGE_1') {
      showActions.approve = true;
      showActions.reject = true;
    } else if (user?.role === 'Stage 2' && request.stage1_status === 'APPROVED' && request.stage2_status === 'PENDING') {
      showActions.approve = true;
      showActions.reject = true;
    } else if (user?.role === 'Stage 3' && (request.status === 'PENDING_STAGE_2_AND_3' || request.status === 'PENDING_STAGE_3') && !request.completed_date) {
      showActions.complete = true;
    }
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  if (error || !request) {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>Back to Dashboard</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')} 
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          Request Details: {request.req_id}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" color="primary" gutterBottom>Request Information</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box width={{ xs: '100%', sm: '45%' }}><Typography variant="body1"><strong>Request ID:</strong> {request.req_id}</Typography></Box>
            <Box width={{ xs: '100%', sm: '45%' }}><Typography variant="body1"><strong>Type:</strong> {request.request_type}</Typography></Box>
            <Box width={{ xs: '100%', sm: '45%' }}><Typography variant="body1"><strong>Requested By:</strong> {request.requested_by?.name || request.department || 'Unknown'}</Typography></Box>
            <Box width={{ xs: '100%', sm: '45%' }}><Typography variant="body1"><strong>Requested Date:</strong> {new Date(request.requested_date).toLocaleString()}</Typography></Box>
            <Box width={{ xs: '100%', sm: '45%' }} display="flex" alignItems="center" gap={1}>
              <Typography variant="body1"><strong>Status:</strong></Typography>
              <Chip label={formatStatus(request, user, stages)} size="medium" sx={{ fontWeight: 'bold' }} />
            </Box>
          </Box>
        </Paper>

        {/* New Bill Details */}
        {request.request_type === 'NEW_BILL' && (
          <>
            <Typography variant="h6" color="primary" gutterBottom>New Bill Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="body1"><strong>BLDESC:</strong> {request.bldesc}</Typography>
                {request.category && <Typography variant="body1"><strong>CATEGORY:</strong> {request.category}</Typography>}
                <Typography variant="body1"><strong>SERGRPDESC:</strong> {request.sergrpdesc}</Typography>
                <Typography variant="body1"><strong>BILLGRPDESC:</strong> {request.billgrpdesc}</Typography>
                <Box display="flex" gap={3}>
                  <Box width="45%"><Typography variant="body1"><strong>SF:</strong> {request.sf}</Typography></Box>
                  <Box width="45%"><Typography variant="body1"><strong>Doctor:</strong> {request.doctor}</Typography></Box>
                </Box>
                <Typography variant="body1"><strong>Date:</strong> {new Date(request.requested_date).toLocaleDateString()}</Typography>
              </Box>
            </Paper>
          </>
        )}

        {/* Bulk Upload Details */}
        {request.request_type === 'BULK_UPLOAD' && (
          <>
            <Typography variant="h6" color="primary" gutterBottom>Bulk Upload Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box display="flex" flexWrap="wrap" gap={3}>
                <Box width="100%">
                  <Typography variant="body1">
                    <strong>Attached File:</strong> {request.file_path ? <a href={`${api.defaults.baseURL}/requests/${request.id}/download/original`} target="_blank" rel="noreferrer">{request.file_path.split('/').pop()}</a> : 'No file attached'}
                  </Typography>
                </Box>
                {request.processed_file_path && (
                  <Box width="100%">
                    <Typography variant="body1">
                      <strong>Processed File:</strong> <a href={`${api.defaults.baseURL}/requests/${request.id}/download/processed`} target="_blank" rel="noreferrer">{request.processed_file_path.split('/').pop()}</a>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </>
        )}

        {/* Update Details */}
        {(request.request_type === 'RATE_UPDATE' || request.request_type === 'DESCRIPTION_UPDATE') && (
          <>
            <Typography variant="h6" color="primary" gutterBottom>Update Request Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="body1"><strong>Bill Code:</strong> {request.bill_code}</Typography>
                {request.request_type === 'RATE_UPDATE' && (
                  <Box display="flex" gap={3}>
                    <Box width="45%"><Typography variant="body1"><strong>Old Rate:</strong> {request.old_rate}</Typography></Box>
                    <Box width="45%"><Typography variant="body1"><strong>New Rate:</strong> {request.new_rate}</Typography></Box>
                  </Box>
                )}
                {request.request_type === 'DESCRIPTION_UPDATE' && (
                  <>
                    <Typography variant="body1"><strong>Old Description:</strong> {request.old_description}</Typography>
                    <Typography variant="body1"><strong>New Description:</strong> {request.new_description}</Typography>
                  </>
                )}
              </Box>
            </Paper>
          </>
        )}

        {/* Mapping Details */}
        {request.request_type === 'MAPPING_REQUEST' && (
          <>
            <Typography variant="h6" color="primary" gutterBottom>Mapping Request Details</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={3}>
                  <Box width="45%"><Typography variant="body1"><strong>Bill Code:</strong> {request.bill_code}</Typography></Box>
                  <Box width="45%"><Typography variant="body1"><strong>BLDESC:</strong> {request.old_description}</Typography></Box>
                </Box>
                <Box display="flex" gap={3}>
                  <Box width="45%"><Typography variant="body1"><strong>Doctor:</strong> {request.doctor}</Typography></Box>
                  <Box width="45%"><Typography variant="body1"><strong>Payer:</strong> {request.payer}</Typography></Box>
                </Box>
                <Box display="flex" gap={3}>
                  <Box width="45%"><Typography variant="body1"><strong>CPT Code:</strong> {request.cpt_code}</Typography></Box>
                  <Box width="45%"><Typography variant="body1"><strong>CPT Description:</strong> {request.cpt_description}</Typography></Box>
                </Box>
              </Box>
            </Paper>
          </>
        )}

        {/* Approvals */}
        <Typography variant="h6" color="primary" gutterBottom>Approval Information</Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <Box width={{ xs: '100%', sm: '45%' }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>{stages[1]?.name || 'Stage 1'} Status</Typography>
              <Typography variant="body1"><strong>Status:</strong> {request.stage1_status || 'PENDING'}</Typography>
              {request.stage1_user?.name && <Typography variant="body1"><strong>Approved By:</strong> {request.stage1_user.name}</Typography>}
              {request.stage1_date && <Typography variant="body1"><strong>Date:</strong> {new Date(request.stage1_date).toLocaleString()}</Typography>}
              {request.stage1_remarks && <Typography variant="body1"><strong>Remarks:</strong> {request.stage1_remarks}</Typography>}
            </Paper>
          </Box>
          <Box width={{ xs: '100%', sm: '45%' }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="subtitle1" color="primary" fontWeight="bold" gutterBottom>{stages[2]?.name || 'Stage 2'} Status</Typography>
              <Typography variant="body1"><strong>Status:</strong> {request.stage2_status || 'PENDING'}</Typography>
              {request.stage2_user?.name && <Typography variant="body1"><strong>Approved By:</strong> {request.stage2_user.name}</Typography>}
              {request.stage2_date && <Typography variant="body1"><strong>Date:</strong> {new Date(request.stage2_date).toLocaleString()}</Typography>}
              {request.stage2_remarks && <Typography variant="body1"><strong>Remarks:</strong> {request.stage2_remarks}</Typography>}
            </Paper>
          </Box>
        </Box>

        {/* Execution */}
        <Typography variant="h6" color="primary" gutterBottom>Execution Information</Typography>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8f9fa' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {request.request_type === 'NEW_BILL' && (
              <Typography variant="body1"><strong>Final Bill Code:</strong> {request.assigned_bill_code || 'PENDING'}</Typography>
            )}
            <Box display="flex" gap={3}>
              {request.completed_by?.name && <Box width="45%"><Typography variant="body1"><strong>Completed By:</strong> {request.completed_by.name}</Typography></Box>}
              {request.completed_date && <Box width="45%"><Typography variant="body1"><strong>Completed Date:</strong> {new Date(request.completed_date).toLocaleString()}</Typography></Box>}
            </Box>
            {request.it_remarks && <Typography variant="body1"><strong>{stages[3]?.name || 'Stage 3'} Remarks:</strong> {request.it_remarks}</Typography>}
            {request.request_type !== 'NEW_BILL' && !request.completed_by && !request.it_remarks && (
              <Typography variant="body1" color="textSecondary"><i>Execution Pending</i></Typography>
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        {(showActions.approve || showActions.reject || showActions.complete) && (
          <Box mt={4} display="flex" justifyContent="flex-end" sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px solid #e0e0e0' }}>
            {showActions.approve && (
              <Button variant="contained" color="primary" size="large" onClick={() => handleAction(request, 'APPROVE')} sx={{ mr: 1, minWidth: 120 }}>
                Approve
              </Button>
            )}
            {showActions.reject && (
              <Button variant="contained" color="error" size="large" onClick={() => handleAction(request, 'REJECT')} sx={{ mr: 1, minWidth: 120 }}>
                Reject
              </Button>
            )}
            {showActions.complete && (
              <Button variant="contained" color="primary" size="large" onClick={() => handleAction(request, 'COMPLETE')} sx={{ minWidth: 120 }}>
                Complete
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* Modals */}
      <ITCompletionModal 
        open={completionModalOpen} 
        onClose={() => setCompletionModalOpen(false)} 
        request={request} 
        onComplete={(msg) => onModalCloseAndRefresh(msg)} 
      />
      <ApproveRejectModal 
        open={approveRejectModalOpen} 
        onClose={() => setApproveRejectModalOpen(false)} 
        request={request} 
        actionType={actionType}
        stage={stageTarget}
        onComplete={(msg) => onModalCloseAndRefresh(msg)}
      />
      
      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: '50% !important', transform: 'translateY(-50%)' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} icon={false} sx={{ width: '100%', fontSize: '1.1rem', bgcolor: 'primary.main', color: 'white' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RequestDetailsPage;
