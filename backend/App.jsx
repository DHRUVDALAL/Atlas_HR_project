import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './theme/ThemeContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <ThemeContextProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeContextProvider>
  );
};

export default App;
