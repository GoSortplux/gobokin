'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface UIContextType {
  isHallModalOpen: boolean;
  openHallModal: () => void;
  closeHallModal: () => void;
  isStaffModalOpen: boolean;
  openStaffModal: () => void;
  closeStaffModal: () => void;
  isBookingModalOpen: boolean;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openHallModal = useCallback(() => setIsHallModalOpen(true), []);
  const closeHallModal = useCallback(() => setIsHallModalOpen(false), []);

  const openStaffModal = useCallback(() => setIsStaffModalOpen(true), []);
  const closeStaffModal = useCallback(() => setIsStaffModalOpen(false), []);

  const openBookingModal = useCallback(() => setIsBookingModalOpen(true), []);
  const closeBookingModal = useCallback(() => setIsBookingModalOpen(false), []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <UIContext.Provider
      value={{
        isHallModalOpen,
        openHallModal,
        closeHallModal,
        isStaffModalOpen,
        openStaffModal,
        closeStaffModal,
        isBookingModalOpen,
        openBookingModal,
        closeBookingModal,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
