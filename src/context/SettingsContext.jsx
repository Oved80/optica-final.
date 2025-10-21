import React, { createContext, useState, useEffect } from 'react';

export const SettingsContext = createContext();

const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('Atributo data-theme actualizado:', document.documentElement.getAttribute('data-theme')); // Verificar el atributo
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('Nuevo tema:', newTheme); // Verificar el valor del tema
      return newTheme;
    });
  };

  const changeFontSize = (size) => {
    setFontSize(size);
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, fontSize, changeFontSize }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;