"use client";
import React, { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import axios from "axios";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Search, User as UserIcon, Shield, FileText, Hash } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { User, LicenseTier, ManualAssignmentPayload } from "@/types";

const ManualAssignmentTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<LicenseTier[]>([]);
  const [hallCounts, setHallCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<ManualAssignmentPayload>({
    userId: "",
    tierId: "",
    adminNote: "",
    externalReference: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, tiersRes, hallsRes] = await Promise.all([
        api.get("/users"),
        api.get("/license-tiers"),
        api.get("/halls")
      ]);
      // Filter for venue owners only
      const hallOwners = usersRes.data.data.filter((u: User) => u.role.includes('hall-owner'));
      setUsers(hallOwners);
      setTiers(tiersRes.data.data);

      // Calculate venue counts
      const counts: Record<string, number> = {};
      hallsRes.data.data.forEach((venue: { owner?: string | { _id: string } }) => {
        const ownerId = (typeof venue.owner === 'object' ? venue.owner?._id : venue.owner);
        if (ownerId) {
          counts[ownerId] = (counts[ownerId] || 0) + 1;
        }
      });
      setHallCounts(counts);
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Could not fetch required data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    return users.filter(u =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit results for performance
  }, [users, searchTerm]);

  const handleSelectUser = (user: User) => {
    setFormData(prev => ({ ...prev, userId: user._id }));
    setSearchTerm(user.fullName + " (" + user.email + ")");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.tierId) {
      Swal.fire("Wait!", "Please select both a user and a license tier.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Assignment',
      text: "This will manually assign the selected subscription to the user. Any active subscription will be superseded.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, assign it!'
    });

    if (result.isConfirmed) {
      setSubmitting(true);
      try {
        await api.post("/licenses/admin/assign", formData);
        Swal.fire("Success!", "Subscription has been manually assigned.", "success");
        setFormData({
          userId: "",
          tierId: "",
          adminNote: "",
          externalReference: "",
        });
        setSearchTerm("");
      } catch (error: unknown) {
        console.error("Error assigning subscription:", error);
        let errorMsg = "Could not assign subscription.";
        if (axios.isAxiosError(error)) {
          errorMsg = error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }
        Swal.fire("Error", errorMsg, "error");
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  const selectedUser = users.find(u => u._id === formData.userId);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Manual Subscription Assignment</h2>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        {/* User Selection */}
        <div className="relative">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
            <UserIcon size={14} /> Find Venue Owner
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (formData.userId) setFormData(prev => ({ ...prev, userId: "" }));
              }}
              className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {searchTerm && !formData.userId && filteredUsers.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {filteredUsers.map(user => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left px-6 py-4 hover:bg-primary/5 transition-colors flex flex-col border-b border-gray-50 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800">{user.fullName}</span>
                      <span className="text-xs text-gray-400">{user.email}</span>
                    </div>
                    {hallCounts[user._id] > 0 && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-lg">
                        {hallCounts[user._id]} {hallCounts[user._id] === 1 ? 'Venue' : 'Venues'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm && !formData.userId && filteredUsers.length === 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 text-center text-gray-400 text-sm">
              No venue owners found matching &quot;{searchTerm}&quot;
            </div>
          )}

          {selectedUser && (
            <div className="mt-3 ml-1 flex items-center gap-4">
              <div className="text-xs text-green-600 font-bold bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
                Selected: {selectedUser.fullName}
              </div>
              {hallCounts[selectedUser._id] > 0 && (
                <div className="text-xs text-primary font-bold bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                  {hallCounts[selectedUser._id]} {hallCounts[selectedUser._id] === 1 ? 'Venue' : 'Venues'} Owned
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tier Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
            <Shield size={14} /> Select License Tier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tiers.map(tier => (
              <button
                key={tier._id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tierId: tier._id || "" }))}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  formData.tierId === tier._id
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <p className={`font-bold ${formData.tierId === tier._id ? "text-primary" : "text-gray-800"}`}>
                  {tier.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">₦{tier.price} / {tier.durationInDays} days</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes and Reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
              <Hash size={14} /> External Reference
            </label>
            <input
              type="text"
              name="externalReference"
              value={formData.externalReference}
              onChange={handleChange}
              placeholder="e.g. Offline Payment ID, Bank Ref"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
              <FileText size={14} /> Admin Note
            </label>
            <textarea
              name="adminNote"
              value={formData.adminNote}
              onChange={handleChange}
              placeholder="Reason for manual assignment..."
              rows={1}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
              submitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1"
            }`}
          >
            {submitting ? "Assigning..." : "Complete Manual Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualAssignmentTab;
