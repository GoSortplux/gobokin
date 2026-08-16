"use client";
import React from "react";
import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerHeader from "@/components/organizer/OrganizerHeader";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";
import { UIProvider } from "@/context/UIContext";
import TourGuide from "@/components/TourGuide";
import UpdateOrganizerProfileModal from "@/components/organizer/UpdateOrganizerProfileModal";
import { useState } from "react";

const OrganizerLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const shouldShowModal = localStorage.getItem('gobokin_show_profile_update_modal') === 'true';
    if (shouldShowModal) {
      setShowProfileModal(true);
      localStorage.removeItem('gobokin_show_profile_update_modal');
      localStorage.removeItem('gobokin_is_first_event_flow');
    }
  }, []);

  useEffect(() => {
    const isUserRoleOnly = user?.role?.includes('user') && !user?.role?.includes('organizer') && !user?.role?.includes('organizer-staff');

    if (isUserRoleOnly) {
      const isFirstEventFlow = localStorage.getItem('gobokin_is_first_event_flow') === 'true';
      const isCreatingEvent = pathname === '/organizer/dashboard/events/create';
      const isEditingFirstEvent = pathname.startsWith('/organizer/dashboard/events/') && pathname.endsWith('/edit');

      if (!isFirstEventFlow || (!isCreatingEvent && !isEditingFirstEvent)) {
        router.replace('/');
      }
    }
  }, [user, pathname, router]);
  return (
    <UIProvider>
      <TourGuide />
      <UpdateOrganizerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      <div className="flex h-screen bg-gray-100">
        <OrganizerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <OrganizerHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
            {children}
          </main>
        </div>
      </div>
    </UIProvider>
  );
};

export default withAuth(OrganizerLayout, ["organizer", "organizer-staff", "user", "super-admin"]);
