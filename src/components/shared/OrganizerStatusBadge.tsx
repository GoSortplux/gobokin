"use client";

import React from "react";
import { Shield, Sparkles, Award } from "lucide-react";

interface OrganizerStatusBadgeProps {
  status?: string;
  isVerified?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const OrganizerStatusBadge: React.FC<OrganizerStatusBadgeProps> = ({
  status = "",
  isVerified = false,
  size = "medium",
  className = "",
}) => {
  // Normalize and resolve the correct organizer status
  let resolvedStatus = status.toUpperCase().trim();

  // Fallback check if organizerStatus/status is not one of the explicitly known types
  if (!resolvedStatus || !["NEW", "ESTABLISHED", "VERIFIED"].includes(resolvedStatus)) {
    if (isVerified || resolvedStatus === "VERIFIED" || resolvedStatus === "APPROVED") {
      resolvedStatus = "VERIFIED";
    } else if (resolvedStatus === "ESTABLISHED") {
      resolvedStatus = "ESTABLISHED";
    } else {
      resolvedStatus = "NEW";
    }
  }

  // Define visual themes
  let themeClasses = "";
  let label = "";
  let Icon = Award;

  switch (resolvedStatus) {
    case "NEW":
      themeClasses = "bg-slate-100 text-slate-700 border-slate-200";
      label = "New Organizer";
      Icon = Award;
      break;
    case "ESTABLISHED":
      themeClasses = "bg-indigo-100 text-indigo-700 border-indigo-200";
      label = "Established Organizer";
      Icon = Sparkles;
      break;
    case "VERIFIED":
      themeClasses = "bg-emerald-100 text-emerald-700 border-emerald-200";
      label = "Verified Organizer";
      Icon = Shield;
      break;
    default:
      themeClasses = "bg-slate-100 text-slate-700 border-slate-200";
      label = "New Organizer";
      Icon = Award;
  }

  // Handle sizing classes
  let sizeClasses = "";
  let iconSize = 12;

  if (size === "small") {
    sizeClasses = "px-2 py-0.5 text-[8px] rounded-lg gap-1 border";
    iconSize = 10;
  } else if (size === "large") {
    sizeClasses = "px-4.5 py-2 text-xs rounded-2xl gap-2 border-2";
    iconSize = 16;
  } else {
    // medium
    sizeClasses = "px-3.5 py-1 text-[10px] rounded-xl gap-1.5 border";
    iconSize = 12;
  }

  return (
    <div
      className={`inline-flex items-center font-black uppercase tracking-widest transition-colors ${themeClasses} ${sizeClasses} ${className}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      <span>{label}</span>
    </div>
  );
};

export default OrganizerStatusBadge;
