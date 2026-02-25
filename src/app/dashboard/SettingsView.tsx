"use client";
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Swal from "@/utils/sweetalert";
import { User as UserIcon, Shield, Mail, AlertTriangle, Trash2, Eye, EyeOff } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string[];
  phoneNumber?: string;
  deletionRequested?: boolean;
}

const SettingsView = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await api.get("/users/me");
        // API response structure might vary, adjust based on actual data
        setProfile(response.data.data || response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleRequestDeletion = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will place your account into a 'deletion-requested' state. An admin will review and approve your request. Once deleted, you will no longer be able to login. This action cannot be easily undone.",
      icon: "warning",
      input: "text",
      inputPlaceholder: 'Type "delete my account" to confirm',
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, request deletion",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (value !== "delete my account") {
          return 'You must type "delete my account" to confirm';
        }
      },
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Processing...",
          didOpen: () => {
            Swal.showLoading();
          },
          allowOutsideClick: false,
        });

        await api.post("/users/request-deletion");

        // Refresh profile to update status
        const response = await api.get("/users/me");
        setProfile(response.data.data || response.data);

        Swal.fire(
          "Requested!",
          "Your account deletion request has been submitted to the admin.",
          "success"
        );
      } catch (error) {
        console.error("Error requesting deletion:", error);
        Swal.fire("Oops...", "Something went wrong! Please try again later.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire("Oops...", "New passwords do not match!", "error");
      return;
    }

    try {
      Swal.showLoading();
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Swal.fire("Success!", "Your password has been changed.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      Swal.fire("Oops...", "Something went wrong!", "error");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Settings</h2>

      {/* User Information Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" />
          Personal Information
        </h3>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <CustomLoader size={32} />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Full Name
              </p>
              <p className="text-lg text-gray-900">{profile.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </p>
              <p className="text-lg text-gray-900">{profile.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Roles
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.role.map((r) => (
                  <span key={r} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                    {r.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
            {profile.phoneNumber && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-lg text-gray-900">{profile.phoneNumber}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Failed to load profile information.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className="w-full p-2 pr-10 border rounded-md text-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Enter Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full p-2 pr-10 border rounded-md text-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className={`w-full p-2 pr-10 border rounded-md text-gray-600 focus:ring-2 outline-none transition-all ${
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : confirmPassword && newPassword === confirmPassword
                    ? "border-green-500 focus:ring-green-500"
                    : "focus:ring-primary focus:border-transparent"
                }`}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-semibold"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-md">
        <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-red-700 mb-6">
          Once you request account deletion, your account will be marked for removal and pending admin approval.
          You will no longer be able to make new bookings while this request is active.
        </p>

        {profile?.deletionRequested ? (
          <div className="bg-white p-4 rounded-md border border-red-300 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800">Deletion Request Pending</p>
              <p className="text-sm text-red-700">You have already requested to delete your account. An admin is reviewing it.</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleRequestDeletion}
            className="flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-300 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Request Account Deletion
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
