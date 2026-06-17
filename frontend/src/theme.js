import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0a58ca', // Mail Header Blue
    },
    secondary: {
      main: '#e6602e', // Logo Orange
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F9FA',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 16, // Increased base font size
    body1: { fontSize: '1.1rem' },
    body2: { fontSize: '1rem' },
    subtitle1: { fontSize: '1.2rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem', // Larger table data
          padding: '16px', // Give tables more breathing room for the larger font
        },
        head: {
          fontWeight: 'bold',
          fontSize: '1.1rem',
          backgroundColor: '#f5f7fa',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // Larger text fields
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Rounded corners for forms
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // Larger labels
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0, // Prevent AppBar from inheriting Paper's rounded corners
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0, // Prevent Drawer from inheriting Paper's rounded corners
        },
      },
    },
  },
});

export default theme;
