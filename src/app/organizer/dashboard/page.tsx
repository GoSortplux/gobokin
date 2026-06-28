"use client";
import React from "react";
import OrganizerDashboard from "./OrganizerDashboard";
import withAuth from "@/components/auth/withAuth";

const OrganizerDashboardPage = () => {
  return <OrganizerDashboard />;
};

export default withAuth(OrganizerDashboardPage, ["organizer", "organizer-staff"]);
