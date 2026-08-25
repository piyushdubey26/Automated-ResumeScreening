import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('resumeai_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('resumeai_theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f1f5f9';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#f8f7f3';
      document.body.style.color = '#1d2b3a';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
