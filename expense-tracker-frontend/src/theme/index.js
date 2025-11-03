import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5B8DEF' },     // tweak to your brand
    secondary: { main: '#7C4DFF' },
    success: { main: '#2e7d32' },
    error: { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'Segoe UI'].join(','),
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 1 } },
    MuiButton: { defaultProps: { variant: 'contained' } },
  },
});

export default theme;
