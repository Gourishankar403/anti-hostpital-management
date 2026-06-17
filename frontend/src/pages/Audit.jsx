import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Grid, MenuItem } from '@mui/material';
import api from '../api';

const formatStatus = (status, stages) => {
  if (!status) return 'UNKNOWN';
  if (status === 'PENDING_STAGE_1') return `Pending ${stages[1]?.name || 'Stage 1'}`;
  if (status === 'PENDING_STAGE_2_AND_3') return `Pending ${stages[2]?.name || 'Stage 2'} & ${stages[3]?.name || 'Stage 3'}`;
  return status.replace(/_/g, ' ');
};

import { useStages } from '../contexts/StageContext';
import { useDialog } from '../contexts/DialogContext';

const Audit = () => {
  const { stages } = useStages();
  const { showAlert } = useDialog();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit/');
      setLogs(res.data);
      setFilteredLogs(res.data);
    } catch (err) { console.error(err); }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fromDate) params.append('from_date', filters.fromDate);
      if (filters.toDate) params.append('to_date', filters.toDate);
      
      const response = await api.get(`/audit/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_export.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) { console.error(err); showAlert("Failed to export", "Export Error"); }
  };

  const handleFilter = () => {
    let result = logs;
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      result = result.filter(l => new Date(l.requested_date) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter(l => new Date(l.requested_date) <= to);
    }
    setFilteredLogs(result);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block" mb={0.5}>
              From Date
            </Typography>
            <TextField 
              fullWidth 
              type="date"
              value={filters.fromDate} 
              onChange={e => setFilters({...filters, fromDate: e.target.value})} 
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block" mb={0.5}>
              To Date
            </Typography>
            <TextField 
              fullWidth 
              type="date"
              value={filters.toDate} 
              onChange={e => setFilters({...filters, toDate: e.target.value})} 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" justifyContent="flex-start" alignItems="flex-end" height="100%">
              <Button variant="outlined" size="large" onClick={handleFilter} sx={{ height: 56, minWidth: 160, mr: 3 }}>Apply Filters</Button>
              <Button variant="contained" color="secondary" size="large" onClick={handleExport} sx={{ height: 56, minWidth: 160 }}>Export CSV</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Requested By</TableCell>
              <TableCell>Requested Date</TableCell>
              <TableCell>Approved By</TableCell>
              <TableCell>Finance Reviewed By</TableCell>
              <TableCell>Action Taken By</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Bill Code</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.requested_by || 'Not Applicable'}</TableCell>
                <TableCell>{log.requested_date ? new Date(log.requested_date).toLocaleString() : 'Not Applicable'}</TableCell>
                <TableCell>{log.approved_by || 'Not Applicable'}</TableCell>
                <TableCell>{log.finance_reviewed_by || 'Not Applicable'}</TableCell>
                <TableCell>{log.action_taken_by || 'Not Applicable'}</TableCell>
                <TableCell>{log.request_type || 'Not Applicable'}</TableCell>
                <TableCell>{log.bill_code || 'Not Applicable'}</TableCell>
                <TableCell>{formatStatus(log.status, stages) || 'Not Applicable'}</TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No audit logs found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Audit;
