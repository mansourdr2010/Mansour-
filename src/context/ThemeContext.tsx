import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<AppTheme>('light');

  const setTheme = () => {
    try {
      localStorage.setItem('pedonco_theme', 'light');
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    // dark theme is removed; enforce light theme
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    try {
      localStorage.setItem('pedonco_theme', 'light');
    } catch {
      // ignore
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
