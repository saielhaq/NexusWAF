import React from 'react';
import { Moon, Sun, Shield } from 'lucide-react';

interface TopBarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function TopBar({ darkMode, toggleDarkMode }: TopBarProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              NexusWAF Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Web Application Firewall Management
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
}