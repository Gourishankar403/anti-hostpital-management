import React, { useState } from 'react';
import { Box, Button, TextField, Typography, MenuItem, Paper, CircularProgress, Stack, Checkbox, FormControlLabel, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../api';
import { useDialog } from '../contexts/DialogContext';

const CreateRequest = ({ requestType, onSuccess, onCancel }) => {
  // If requestType is UPDATE_REQUEST, we need a sub-type selector
  const [subType, setSubType] = useState('RATE_UPDATE');
  const [formData, setFormData] = useState({});
  const [toEmails, setToEmails] = useState(() => {
    const saved = localStorage.getItem('default_to_email');
    if (!saved) return [''];
    const arr = saved.split(',').map(e => e.trim()).filter(e => e);
    return arr.length > 0 ? arr : [''];
  });
  const [ccEmails, setCcEmails] = useState(() => {
    const saved = localStorage.getItem('default_cc_email');
    if (!saved) return [''];
    const arr = saved.split(',').map(e => e.trim()).filter(e => e);
    return arr.length > 0 ? arr : [''];
  });
  const [saveDefaultEmail, setSaveDefaultEmail] = useState(true);
  const [loadingCode, setLoadingCode] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const { showAlert } = useDialog();

  const actualType = requestType === 'UPDATE_REQUEST' ? subType : requestType;

  const handleChange = (field, value) => {
    if (field === 'doctor') {
      if (value !== '' && !/^[a-zA-Z\s.]+$/.test(value)) {
        return;
      }
    }
    if (field === 'new_rate' || field === 'sf') {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillCodeSearch = async () => {
    if (!searchCode) return;
    setLoadingCode(true);
    try {
      const res = await api.get(`/requests/bill-code/${searchCode}`);
      const data = res.data;
      setFormData((prev) => ({
        ...prev,
        bill_code: data.bill_code,
        old_rate: data.old_rate || data.rate,
        old_description: data.old_description || data.description,
        bldesc: data.bldesc,
        category: data.category,
        sergrpdesc: data.sergrpdesc,
        billgrpdesc: data.billgrpdesc,
        deptdesc: data.deptdesc,
      }));
    } catch (err) {
      setFormData({});
      showAlert("That bill code doesn't exist!", "Not Found");
    } finally {
      setLoadingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalToEmail = toEmails.map(e => e.trim()).filter(e => e).join(',');
    const finalCcEmail = ccEmails.map(e => e.trim()).filter(e => e).join(',');

    if (saveDefaultEmail) {
      if (finalToEmail) localStorage.setItem('default_to_email', finalToEmail);
      if (finalCcEmail) localStorage.setItem('default_cc_email', finalCcEmail);
    }
    
    try {
      if (actualType === 'BULK_UPLOAD') {
        const formDataPayload = new FormData();
        formDataPayload.append('request_type', actualType);
        formDataPayload.append('file', formData.file);
        if (finalToEmail) formDataPayload.append('to_email', finalToEmail);
        if (finalCcEmail) formDataPayload.append('cc_email', finalCcEmail);
        await api.post('/requests/bulk_upload', formDataPayload);
      } else {
        const payload = {
          request_type: actualType,
          ...formData,
          to_email: finalToEmail,
          cc_email: finalCcEmail,
          bill_code: searchCode || formData.bill_code // Ensure bill_code is sent
        };
        await api.post('/requests/', payload);
      }
      onSuccess('Request submitted successfully!');
    } catch (err) {
      console.error(err);
      showAlert("Failed to create request", "Submission Error");
    }
  };

  const renderBillCodeSearch = () => (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3 }}>
      <TextField 
        sx={{ flexGrow: 1 }}
        label="Search Existing Bill Code" 
        value={searchCode} 
        onChange={(e) => setSearchCode(e.target.value)} 
        onBlur={handleBillCodeSearch}
        required
      />
      <Button variant="contained" onClick={handleBillCodeSearch} disabled={loadingCode} sx={{ minWidth: 100, height: 56 }}>
        {loadingCode ? <CircularProgress size={24} color="inherit" /> : 'Search'}
      </Button>
    </Box>
  );

  const renderFields = () => {
    switch (actualType) {
      case 'NEW_BILL':
        return (
          <>
            <TextField fullWidth label="BLDESC" required value={formData.bldesc || ''} onChange={(e) => handleChange('bldesc', e.target.value)} sx={{ mb: 4 }} />
            <TextField select fullWidth label="CATEGORY" required value={formData.category || ''} onChange={(e) => handleChange('category', e.target.value)} sx={{ mb: 4 }}>
              {['Option 1', 'Option 2', 'Option 3'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="SERGRPDESC" required value={formData.sergrpdesc || ''} onChange={(e) => handleChange('sergrpdesc', e.target.value)} sx={{ mb: 4 }}>
              {['Option 1', 'Option 2', 'Option 3'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="BILLGRPDESC" required value={formData.billgrpdesc || ''} onChange={(e) => handleChange('billgrpdesc', e.target.value)} sx={{ mb: 4 }}>
              {['Option 1', 'Option 2', 'Option 3'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="DEPTDESC" required value={formData.deptdesc || ''} onChange={(e) => handleChange('deptdesc', e.target.value)} sx={{ mb: 4 }}>
              {['Option 1', 'Option 2', 'Option 3'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
              <TextField sx={{ flex: 1 }} fullWidth label="SF" type="number" value={formData.sf || ''} inputProps={{ min: 0 }} required onChange={(e) => handleChange('sf', e.target.value)} />
              <TextField sx={{ flex: 1 }} fullWidth label="Doctor" value={formData.doctor || ''} inputProps={{ pattern: "^[a-zA-Z\\s.]+$", title: "Only letters, spaces, and periods are allowed" }} required onChange={(e) => handleChange('doctor', e.target.value)} />
            </Stack>
          </>
        );
      case 'RATE_UPDATE':
      case 'DESCRIPTION_UPDATE':
      case 'RATE_AND_DESCRIPTION_UPDATE':
        return (
          <>
            {renderBillCodeSearch()}
            <TextField fullWidth label="Current Description" disabled value={formData.old_description || ''} sx={{ mb: 4 }} />
            <TextField fullWidth label="Current Rate" disabled value={formData.old_rate || ''} sx={{ mb: 4 }} />
            
            {(actualType === 'RATE_UPDATE' || actualType === 'RATE_AND_DESCRIPTION_UPDATE') && (
              <TextField fullWidth label="New Rate" type="number" inputProps={{ min: 0 }} required onChange={(e) => handleChange('new_rate', e.target.value)} sx={{ mb: 4 }} />
            )}
            {(actualType === 'DESCRIPTION_UPDATE' || actualType === 'RATE_AND_DESCRIPTION_UPDATE') && (
              <TextField fullWidth label="New Description" required onChange={(e) => handleChange('new_description', e.target.value)} sx={{ mb: 4 }} />
            )}
          </>
        );
      case 'MAPPING_REQUEST':
        return (
          <>
            {renderBillCodeSearch()}
            <TextField fullWidth label="BLDESC" disabled value={formData.old_description || ''} sx={{ mb: 4 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
              <TextField sx={{ flex: 1 }} fullWidth label="CPT Code" required onChange={(e) => handleChange('cpt_code', e.target.value)} />
              <TextField sx={{ flex: 1 }} fullWidth label="CPT Description" required onChange={(e) => handleChange('cpt_description', e.target.value)} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
              <TextField sx={{ flex: 1 }} fullWidth label="Payer" value={formData.payer || ''} required onChange={(e) => handleChange('payer', e.target.value)} />
              <TextField sx={{ flex: 1 }} fullWidth label="Doctor" value={formData.doctor || ''} inputProps={{ pattern: "^[a-zA-Z\\s.]+$", title: "Only letters, spaces, and periods are allowed" }} required onChange={(e) => handleChange('doctor', e.target.value)} />
            </Stack>
          </>
        );
      case 'BULK_UPLOAD':
        return (
          <Box width="100%" sx={{ mb: 4 }}>
            <Button variant="outlined" component="label" fullWidth sx={{ py: 2, borderStyle: 'dashed', borderWidth: 2 }}>
              Upload Excel File
              <input type="file" hidden onChange={(e) => handleChange('file', e.target.files[0])} />
            </Button>
            {formData.file && <Typography variant="caption" display="block" mt={1}>Selected: {formData.file.name}</Typography>}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <form onSubmit={handleSubmit}>
        <Box display="flex" flexDirection="column" gap={3}>
          {requestType === 'UPDATE_REQUEST' && (
            <TextField
              select
              fullWidth
              label="Update Type"
              value={subType}
              onChange={(e) => {
                setSubType(e.target.value);
                setFormData({});
                setSearchCode('');
              }}
              sx={{ mb: 4 }}
            >
              <MenuItem value="RATE_UPDATE">Rate Update</MenuItem>
              <MenuItem value="DESCRIPTION_UPDATE">Description Update</MenuItem>
              <MenuItem value="RATE_AND_DESCRIPTION_UPDATE">Rate & Description Update</MenuItem>
            </TextField>
          )}
          
          {renderFields()}
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} sx={{ mb: 4, mt: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>To Email *</Typography>
              {toEmails.map((email, index) => (
                <Box key={`to-${index}`} sx={{ display: 'flex', gap: 1, mb: index < toEmails.length - 1 ? 2 : 0 }}>
                  <TextField 
                    fullWidth 
                    size="small"
                    required={index === 0}
                    type="email" 
                    placeholder="example@domain.com"
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
                    placeholder="example@domain.com"
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
            sx={{ mb: 2, display: 'block' }}
          />
          
          <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
            <Button variant="contained" color="primary" onClick={onCancel} size="large">Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              disabled={actualType === 'BULK_UPLOAD' && !formData.file}
            >
              Submit Request
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default CreateRequest;
