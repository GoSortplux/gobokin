"use client";
import Dashboard from './Dashboard';
import withAuth from "@/components/auth/withAuth";

const DashboardPage = () => {
  return <Dashboard />;
};

export default withAuth(DashboardPage, ["user"]);
