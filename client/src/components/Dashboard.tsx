import React, { useState } from 'react';
import Sidebar from './Sidebar';
import GroupList from './GroupList';
import Ranking from './Ranking';
import { Bars3Icon } from '@heroicons/react/24/solid';

const Dashboard = ({ theme, setTheme, selectedCategory, setSelectedCategory }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State for sidebar visibility

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      <div className={`
        ${isSidebarOpen ? 'w-48' : 'w-0 overflow-hidden'} 
        p-4 border-r border-[var(--color-border-card)] 
        transition-all duration-300 ease-in-out flex-shrink-0
      `}>
        {isSidebarOpen && (
          <Sidebar 
            theme={theme} 
            setTheme={setTheme} 
            selectedCategory={selectedCategory} 
            setSelectedCategory={setSelectedCategory} 
          />
        )}
      </div>

      <div className="flex-1 flex flex-col"> {/* Use flex-col for main content area */}
        <div className="p-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto"> {/* Added overflow-y-auto for scrollable content */}
          <GroupList selectedCategory={selectedCategory} />
        </div>
      </div>
      <div className="w-80 p-4 border-l border-[var(--color-border-card)]">
        <Ranking />
      </div>
    </div>
  );
};

export default Dashboard;
