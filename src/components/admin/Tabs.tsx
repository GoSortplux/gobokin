"use client";

import React from 'react';

interface Tab {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabValue: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm inline-flex mb-8">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              ${activeTab === tab.value
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              } whitespace-nowrap py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 focus:outline-none
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;
