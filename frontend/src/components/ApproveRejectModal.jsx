import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Stack, Checkbox, FormControlLabel } from '@mui/material';
import api from '../api';
import { useDialog } from '../contexts/DialogContext';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { IconButton } from '@mui/material';

const ApproveRejectModal = ({ open, onClose, request, actionType, stage, onComplete }) => {
  const [remarks, setRemarks] = useState('');
  const [toEmails, setToEmails] = useState(['']);
  const [ccEmails, setCcEmails] = useState(['']);
  const [saveDefaultEmail, setSaveDefaultEmail] = useState(true);
  const { showAlert } = useDialog();

  React.useEffect(() => {
    if (open) {
      const savedTo = localStorage.getItem('default_to_email');
      setToEmails(savedTo ? savedTo.split(',').map(e => e.trim()).filter(e => e) : ['']);
      const savedCc = localStorage.getItem('default_cc_email');
      setCcEmails(savedCc ? savedCc.split(',').map(e => e.trim()).filter(e => e) : ['']);
      if (toEmails.length === 0) setToEmails(['']);
      if (ccEmails.length === 0) setCcEmails(['']);
      setRemarks('');
    }
  }, [open]);

  if (!request) return null;

  const handleSubmit = async () => {
    const finalToEmail = toEmails.map(e => e.trim()).filter(e => e).join(',');
    const finalCcEmail = ccEmails.map(e => e.trim()).filter(e => e).join(',');

    if (saveDefaultEmail) {
      if (finalToEmail) localStorage.setItem('default_to_email', finalToEmail);
      if (finalCcEmail) localStorage.setItem('default_cc_email', finalCcEmail);
    }
    try {
      await api.post(`/requests/${request.id}/stage${stage}`, {
        status: actionType, // 'APPROVED' or 'REJECTED'
        remarks: remarks,
        to_email: finalToEmail,
        cc_email: finalCcEmail
      });
      onComplete(`Request successfully ${actionType.toLowerCase()}!`);
    } catch (err) {
      console.error(err);
      showAlert(`Failed to process action: ${err.response?.data?.detail || err.message}`, 'Error');
    }
  };

  const isReject = actionType === 'REJECTED';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: isReject ? 'error.main' : 'primary.main', color: 'white' }}>
        {isReject ? 'Reject Request' : 'Approve Request'}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1" mb={2}>
          Are you sure you want to {isReject ? 'reject' : 'approve'} request <strong>{request.req_id}</strong>?
        </Typography>
        <Box display="flex" flexDirection="column" sx={{ gap: 2, mt: 2 }}>
          {!isReject && (stage === 1 || stage === 2) && (
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} sx={{ mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary" mb={1}>To Email *</Typography>
                  {toEmails.map((email, index) => (
                    <Box key={`to-${index}`} sx={{ display: 'flex', gap: 1, mb: index < toEmails.length - 1 ? 2 : 0 }}>
                      <TextField 
                        fullWidth 
                        size="small"
                        required={index === 0}
                        type="email" 
                        placeholder="example@gmail.com"
                        value={email} 
                        onChange={(e) => {
                          const newEmails = [...toEmails];
                          newEmails[index] = e.target.value;
                          setToEmails(newEmails);
                        }} 
                      />
                      {index === toEmails.length - 1 ? (
                        <IconButton color="primary" onClick={() => setToEmails([...toEmails, ''])}><AddIcon /></IconButton>
                      ) : (
                        <IconButton color="error" onClick={() => setToEmails(toEmails.filter((_, i) => i !== index))}><RemoveIcon /></IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary" mb={1}>Cc Email</Typography>
                  {ccEmails.map((email, index) => (
                    <Box key={`cc-${index}`} sx={{ display: 'flex', gap: 1, mb: index < ccEmails.length - 1 ? 2 : 0 }}>
                      <TextField 
                        fullWidth 
                        size="small"
                        type="email" 
                        placeholder="example@gmail.com"
                        value={email} 
                        onChange={(e) => {
                          const newEmails = [...ccEmails];
                          newEmails[index] = e.target.value;
                          setCcEmails(newEmails);
                        }} 
                      />
                      {index === ccEmails.length - 1 ? (
                        <IconButton color="primary" onClick={() => setCcEmails([...ccEmails, ''])}><AddIcon /></IconButton>
                      ) : (
                        <IconButton color="error" onClick={() => setCcEmails(ccEmails.filter((_, i) => i !== index))}><RemoveIcon /></IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              </Stack>
              <FormControlLabel
                control={<Checkbox checked={saveDefaultEmail} onChange={(e) => setSaveDefaultEmail(e.target.checked)} color="primary" />}
                label="Save these emails as default"
                sx={{ mt: 1, mb: 3 }}
              />
            </Box>
          )}
          <Box>
            <TextField 
              label="Remarks (Optional)"
              placeholder="Enter remarks..." 
              multiline 
              rows={3} 
              fullWidth 
              value={remarks} 
              onChange={(e) => setRemarks(e.target.value)} 
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 3 }}>
        <Button variant="contained" color="primary" onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color={isReject ? "error" : "primary"} 
          onClick={handleSubmit}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveRejectModal;
