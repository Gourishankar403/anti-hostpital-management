import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    title: '',
    message: '',
    type: 'alert', // 'alert' | 'confirm'
    onConfirm: null,
  });

  const showAlert = (message, title = 'Alert') => {
    setDialogConfig({
      open: true,
      title,
      message,
      type: 'alert',
      onConfirm: null,
    });
  };

  const showConfirm = (message, title = 'Confirm', onConfirmCallback) => {
    setDialogConfig({
      open: true,
      title,
      message,
      type: 'confirm',
      onConfirm: onConfirmCallback,
    });
  };

  const handleClose = () => {
    setDialogConfig({ ...dialogConfig, open: false });
  };

  const handleConfirm = () => {
    if (dialogConfig.onConfirm) {
      dialogConfig.onConfirm();
    }
    handleClose();
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Dialog 
        open={dialogConfig.open} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: 3, p: 1, minWidth: '350px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: dialogConfig.type === 'confirm' && dialogConfig.title.toLowerCase().includes('warning') ? 'error.main' : 'primary.main' }}>
          {dialogConfig.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', mt: 1 }}>
            {dialogConfig.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 2 }}>
          {dialogConfig.type === 'confirm' && (
            <Button onClick={handleClose} color="inherit" variant="outlined">
              Cancel
            </Button>
          )}
          <Button 
            onClick={dialogConfig.type === 'confirm' ? handleConfirm : handleClose} 
            color={dialogConfig.type === 'confirm' && dialogConfig.title.toLowerCase().includes('warning') ? 'error' : 'primary'} 
            variant="contained" 
            autoFocus
          >
            {dialogConfig.type === 'confirm' ? 'Confirm' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </DialogContext.Provider>
  );
};
