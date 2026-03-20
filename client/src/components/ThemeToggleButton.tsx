import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'; // Assuming Heroicons for icons

interface ThemeToggleButtonProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg bg-[var(--color-accent-fab)] text-white
                 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-fab)] focus:ring-opacity-75
                 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6" />
      ) : (
        <SunIcon className="h-6 w-6" />
      )}
    </button>
  );
};

export default ThemeToggleButton;