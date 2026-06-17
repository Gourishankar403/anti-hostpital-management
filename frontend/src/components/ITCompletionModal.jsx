import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Checkbox, FormControlLabel, Stack, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../api';
import { useDialog } from '../contexts/DialogContext';

const ITCompletionModal = ({ open, onClose, request, onComplete }) => {
  const [billCode, setBillCode] = useState(request?.bill_code || '');
  const [toEmails, setToEmails] = useState(() => {
    const saved = localStorage.getItem('default_to_email');
    return saved ? saved.split(',').map(e => e.trim()).filter(e => e) : [''];
  });
  const [ccEmails, setCcEmails] = useState(() => {
    const saved = localStorage.getItem('default_cc_email');
    return saved ? saved.split(',').map(e => e.trim()).filter(e => e) : [''];
  });
  const [saveDefaultEmail, setSaveDefaultEmail] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useDialog();

  const isBulk = request?.request_type === 'BULK_UPLOAD';

  const handleSubmit = async () => {
    setIsLoading(true);
    const finalToEmail = toEmails.map(e => e.trim()).filter(e => e).join(',');
    const finalCcEmail = ccEmails.map(e => e.trim()).filter(e => e).join(',');

    if (saveDefaultEmail) {
      if (finalToEmail) localStorage.setItem('default_to_email', finalToEmail);
      if (finalCcEmail) localStorage.setItem('default_cc_email', finalCcEmail);
    }
    
    try {
      if (isBulk) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('remarks', remarks);
        if (finalToEmail) formData.append('to_email', finalToEmail);
        if (finalCcEmail) formData.append('cc_email', finalCcEmail);

        await api.post(`/requests/${request.id}/complete_bulk`, formData);
      } else {
        const finalBillCode = request?.request_type === 'NEW_BILL' ? billCode : (request?.bill_code || 'COMPLETED');
        await api.post(`/requests/${request.id}/complete`, {
          assigned_bill_code: finalBillCode,
          to_email: finalToEmail,
          cc_email: finalCcEmail,
          remarks: remarks
        });
      }
      onComplete('Request marked as completed successfully!');
    } catch (err) {
      console.error(err);
      showAlert('Failed to complete request', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isBulk ? (!file) : (request?.request_type === 'NEW_BILL' ? (!billCode.trim() || toEmails.length === 0) : (toEmails.length === 0));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        Complete {isBulk ? 'Bulk Upload' : 'Request'}
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={4} mt={1} mb={2}>
          {isBulk ? (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>Upload Processed File (Mandatory)</Typography>
              <Button 
                variant="outlined" 
                component="label" 
                fullWidth 
                sx={{ 
                  py: 1.5, 
                  justifyContent: 'flex-start', 
                  textTransform: 'none', 
                  color: file ? 'text.primary' : 'text.secondary', 
                  borderColor: 'rgba(0, 0, 0, 0.23)' 
                }}
              >
                {file ? file.name : "Choose File..."}
                <input 
                  type="file" 
                  hidden
                  onChange={(e) => setFile(e.target.files[0])} 
                  accept=".csv,.xlsx,.xls"
                />
              </Button>
            </Box>
          ) : request?.request_type === 'NEW_BILL' ? (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>Assigned Bill Code (Mandatory)</Typography>
              <TextField 
                label="Enter new bill code..." 
                required 
                fullWidth 
                value={billCode} 
                onChange={(e) => setBillCode(e.target.value)} 
              />
            </Box>
          ) : null}
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
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
            sx={{ mt: 1 }}
          />

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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', gap: 3 }}>
        <Button variant="contained" color="primary" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={isSubmitDisabled || isLoading}
        >
          {isLoading ? 'Sending...' : 'Confirm Completion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ITCompletionModal;
