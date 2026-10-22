import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Indigo-Blue accent
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#0f172a', // Slate dark
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Enterprise UI best practice (no uppercase buttons)
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});