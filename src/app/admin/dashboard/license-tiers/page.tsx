"use client";
import React, { useState } from "react";
import withAuth from "@/components/auth/withAuth";
import Tabs from "@/components/admin/Tabs";
import LicenseTiersTab from "@/components/admin/LicenseTiersTab";
import SubscriptionRulesTab from "@/components/admin/SubscriptionRulesTab";
import ManualAssignmentTab from "@/components/admin/ManualAssignmentTab";

const LicenseTiersPage = () => {
  const [activeTab, setActiveTab] = useState("tiers");

  const tabs = [
    { label: "License Tiers", value: "tiers" },
    { label: "Subscription Rules", value: "rules" },
    { label: "Manual Assignment", value: "assign" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Manage Licenses & Rules</h1>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div>
        {activeTab === "tiers" && <LicenseTiersTab />}
        {activeTab === "rules" && <SubscriptionRulesTab />}
        {activeTab === "assign" && <ManualAssignmentTab />}
      </div>
    </div>
  );
};

export default withAuth(LicenseTiersPage, ["super-admin"]);
