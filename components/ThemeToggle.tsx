import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
    collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed = false }) => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 text-discord-textMuted hover:text-white hover:bg-discord-hover rounded-xl transition-all duration-300 font-medium group`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? (
                <Sun
                    size={20}
                    className="group-hover:rotate-90 transition-transform duration-300 flex-shrink-0 text-yellow-400/70 group-hover:text-yellow-400"
                />
            ) : (
                <Moon
                    size={20}
                    className="group-hover:-rotate-12 transition-transform duration-300 flex-shrink-0 text-discord-accent/70 group-hover:text-discord-accent"
                />
            )}
            {!collapsed && (
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
        </button>
    );
};

export default ThemeToggle;