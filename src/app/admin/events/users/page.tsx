"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Globe,
  FileText,
  AlertCircle,
  Clock,
  Search,
  Edit2,
  X,
  Shield,
  Percent,
  Users,
  Save,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import CustomLoader from "@/components/CustomLoader";
import { formatCurrency } from "@/utils/currency";

// Standard Badge matching OrganizerStatusBadge styles
const LocalStatusBadge = ({ status }: { status: string }) => {
  let classes = "bg-slate-100 text-slate-800 border-slate-200";
  if (status === 'VERIFIED') {
    classes = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (status === 'ESTABLISHED') {
    classes = "bg-indigo-100 text-indigo-700 border-indigo-200";
  } else if (status === 'NEW' || status === 'PENDING') {
    classes = "bg-blue-100 text-blue-700 border-blue-200";
  } else if (status === 'SUSPENDED') {
    classes = "bg-rose-100 text-rose-700 border-rose-200";
  }
  return (
    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${classes}`}>
      {status}
    </span>
  );
};

interface ManageOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizer: any;
  onUpdate: () => void;
}

const ManageOrganizerModal = ({ isOpen, onClose, organizer, onUpdate }: ManageOrganizerModalProps) => {
  const [modalTab, setModalTab] = useState<'profile' | 'financials' | 'subscription'>('profile');
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    isVerified: false,
    commissionRate: 0,
    payoutPolicy: "",
    maxStaff: 0,
    autoPromotionEligible: false,
    reason: "",
    adminNotes: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (organizer) {
      setFormData({
        status: organizer.status || "PENDING",
        isVerified: organizer.isVerified || false,
        commissionRate: Number(organizer.commissionRate) || 0,
        payoutPolicy: organizer.payoutPolicy || "",
        maxStaff: organizer.maxStaff || 10,
        autoPromotionEligible: organizer.autoPromotionEligible || false,
        reason: "",
        adminNotes: organizer.adminNotes || ""
      });
    }
  }, [organizer]);

  useEffect(() => {
    if (isOpen && modalTab === 'subscription') {
      fetchPackages();
    }
  }, [isOpen, modalTab]);

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const res = await api.get('/events/admin/packages');
      setPackages(res.data.data || []);
    } catch (err) {
      console.error("Failed to load packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  if (!isOpen || !organizer) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.patch(`/events/admin/organizers/${organizer.id}`, formData);
      Swal.fire('Success', 'Organizer profile updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssignSubscription = async () => {
    if (!selectedPackageId) {
      Swal.fire('Error', 'Please select a subscription package first', 'warning');
      return;
    }
    setAssignLoading(true);
    try {
      const res = await api.post(`/events/admin/organizers/${organizer.id}/assign-subscription`, {
        packageId: selectedPackageId
      });
      Swal.fire('Success', res.data.message || 'Subscription package assigned successfully!', 'success');
      onUpdate();
      // Refresh current details by calling onUpdate and close modal
      onClose();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl my-8 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Manage <span className="text-primary not-italic">Organizer</span></h3>
            <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">ID: {organizer.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-gray-100 px-8 bg-white">
          <button
            onClick={() => setModalTab('profile')}
            className={`py-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              modalTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Profile Rules
            {modalTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setModalTab('financials')}
            className={`py-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              modalTab === 'financials' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Financials & Wallet
            {modalTab === 'financials' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setModalTab('subscription')}
            className={`py-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${
              modalTab === 'subscription' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Assign Subscription
            {modalTab === 'subscription' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
          </button>
        </div>

        {modalTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Status
                </label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="NEW">NEW</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ESTABLISHED">ESTABLISHED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Percent size={12} /> Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                  value={formData.commissionRate}
                  onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={12} /> Max Staff
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                  value={formData.maxStaff}
                  onChange={e => setFormData({ ...formData, maxStaff: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Payout Policy
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="e.g. Weekly"
                  value={formData.payoutPolicy}
                  onChange={e => setFormData({ ...formData, payoutPolicy: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all border-2 border-transparent has-[:checked]:border-primary/20 has-[:checked]:bg-blue-50/30">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isVerified}
                    onChange={e => setFormData({ ...formData, isVerified: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-900 uppercase">Verified Organizer</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Enable verified badge</span>
                </div>
              </label>

              <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all border-2 border-transparent has-[:checked]:border-primary/20 has-[:checked]:bg-blue-50/30">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.autoPromotionEligible}
                    onChange={e => setFormData({ ...formData, autoPromotionEligible: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-900 uppercase">Auto Promotion</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Eligible for promotion</span>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Reason for update
              </label>
              <textarea
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all h-20 resize-none"
                placeholder="Requested by organizer to change configuration..."
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Admin Notes (Internal)
              </label>
              <textarea
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all h-20 resize-none"
                placeholder="Internal logs / audit trail note..."
                value={formData.adminNotes}
                onChange={e => setFormData({ ...formData, adminNotes: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {submitLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              Save Profile Changes
            </button>
          </form>
        )}

        {modalTab === 'financials' && (
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* Wallet details */}
            <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <Wallet size={16} /> Organizer Wallet Balance
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(organizer.wallet?.availableBalance || 0)}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pending</p>
                  <p className="text-lg font-black text-amber-600 mt-1">{formatCurrency(organizer.wallet?.pendingBalance || 0)}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Withdrawn</p>
                  <p className="text-lg font-black text-gray-500 mt-1">{formatCurrency(organizer.wallet?.withdrawnBalance || 0)}</p>
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="bg-gray-50 rounded-[2rem] p-6 space-y-4 border border-gray-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <CreditCard size={16} /> Settlement Bank Account
              </h4>
              {organizer.bankAccount ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</span>
                    <p className="text-sm font-extrabold text-gray-800">{organizer.bankAccount.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Number</span>
                    <p className="text-sm font-extrabold text-gray-800">{organizer.bankAccount.accountNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Name</span>
                    <p className="text-sm font-extrabold text-gray-800">{organizer.bankAccount.accountName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        organizer.bankAccount.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {organizer.bankAccount.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No bank account details configured.</p>
              )}
            </div>

            {/* Current Active Subscription Package */}
            <div className="bg-gray-50 rounded-[2rem] p-6 space-y-4 border border-gray-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" /> Active Subscription Packages
              </h4>
              {organizer.activeSubscription ? (
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-sm">{organizer.activeSubscription.packageName}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Assigned on: {new Date(organizer.activeSubscription.assignedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                    ACTIVE
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No active subscription packages manually assigned or active.</p>
              )}
            </div>
          </div>
        )}

        {modalTab === 'subscription' && (
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Manual Subscription Assignment</h4>
              <p className="text-xs text-gray-400 font-medium">Instantly grant this organizer access to any subscription package without requiring payment gateway processing.</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select subscription Package</label>
                {loadingPackages ? (
                  <div className="py-4 text-center text-xs text-gray-400">Loading subscription packages...</div>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                      value={selectedPackageId}
                      onChange={e => setSelectedPackageId(e.target.value)}
                    >
                      <option value="">Choose Package...</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatCurrency(pkg.price)} ({pkg.durationDays} days)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAssignSubscription}
                disabled={assignLoading || !selectedPackageId}
                className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {assignLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={16} />}
                Assign Package
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  const [activeMainTab, setActiveMainTab] = useState<'applications' | 'organizers'>('applications');
  const [loading, setLoading] = useState(true);

  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [appFilter, setAppFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");

  // Organizers list state
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [orgPage, setOrgPage] = useState(1);
  const [orgLimit, setOrgLimit] = useState(10);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [orgTotal, setOrgTotal] = useState(0);
  const [orgStatusFilter, setOrgStatusFilter] = useState('ALL');
  const [orgVerificationFilter, setOrgVerificationFilter] = useState('ALL'); // 'ALL', 'true', 'false'
  const [orgSearch, setOrgSearch] = useState('');

  // Edit / Detail Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<any | null>(null);

  useEffect(() => {
    if (activeMainTab === 'applications') {
      fetchApplications();
    } else {
      fetchOrganizers();
    }
  }, [activeMainTab, orgPage, orgLimit, orgStatusFilter, orgVerificationFilter]);

  // Debounced/Triggered manual load for search
  useEffect(() => {
    if (activeMainTab === 'organizers') {
      const delayDebounce = setTimeout(() => {
        setOrgPage(1);
        fetchOrganizers();
      }, 400);
      return () => clearTimeout(delayDebounce);
    }
  }, [orgSearch]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/organizer-applications");
      setApplications(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      setLoadingOrganizers(true);
      let url = `/events/admin/organizers?page=${orgPage}&limit=${orgLimit}`;
      if (orgStatusFilter !== 'ALL') {
        url += `&status=${orgStatusFilter}`;
      }
      if (orgVerificationFilter !== 'ALL') {
        url += `&isVerified=${orgVerificationFilter}`;
      }
      if (orgSearch) {
        url += `&search=${encodeURIComponent(orgSearch)}`;
      }
      const res = await api.get(url);
      setOrganizers(res.data.data || []);
      if (res.data.pagination) {
        setOrgTotal(res.data.pagination.total);
        setOrgTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load organizers:", err);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const fetchOrganizerDetails = async (organizerId: string) => {
    try {
      Swal.showLoading();
      const response = await api.get(`/events/admin/organizers/${organizerId}`);
      setSelectedOrganizer(response.data.data);
      setIsEditModalOpen(true);
      Swal.close();
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch organizer details', 'error');
    }
  };

  const handleAppAction = async (id: string, action: "approve" | "reject") => {
    const { isConfirmed, value: notes } = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Application?`,
      text: `Are you sure you want to ${action} this organizer?`,
      input: 'textarea',
      inputPlaceholder: 'Add admin notes (optional)...',
      icon: action === 'approve' ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
    });

    if (isConfirmed) {
      try {
        Swal.showLoading();
        await api.post(`/events/admin/organizer-applications/${id}/${action}`, {
           adminNotes: notes
        });
        Swal.fire('Success!', `Application has been ${action}d.`, 'success');
        fetchApplications();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = appFilter === "ALL" || app.status === appFilter;
    const matchesSearch =
      app.organizerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data?.portfolio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data?.experience || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">User & <span className="text-primary not-italic">Organizer Management</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Review organizer applications and manage setup configurations.</p>
        </div>
      </div>

      {/* Main High-Level Section Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveMainTab('applications');
          }}
          className={`px-6 py-4 text-sm font-black uppercase tracking-wider transition-all relative ${
            activeMainTab === 'applications' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Organizer Applications
          {activeMainTab === 'applications' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => {
            setActiveMainTab('organizers');
          }}
          className={`px-6 py-4 text-sm font-black uppercase tracking-wider transition-all relative ${
            activeMainTab === 'organizers' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          All Organizers
          {activeMainTab === 'organizers' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeMainTab === 'applications' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
               {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
                 <button
                   key={filter}
                   onClick={() => setAppFilter(filter as any)}
                   className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                     appFilter === filter ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                   }`}
                 >
                   {filter}
                 </button>
               ))}
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="h-64 flex items-center justify-center"><CustomLoader /></div>
            ) : filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <div key={app.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 flex flex-col lg:flex-row gap-8 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group">
                   <div className="w-full lg:w-48 h-48 rounded-3xl bg-gray-50 flex items-center justify-center text-primary relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                      <Briefcase size={64} className="opacity-20" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                         <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                           app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                           app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                         }`}>
                            {app.status}
                         </span>
                      </div>
                   </div>

                   <div className="flex-1 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight">Organizer ID: {app.organizerId.slice(0, 8)}...</h3>
                            <p className="text-gray-400 font-bold flex items-center gap-2 mt-1">
                               <Clock size={14} />
                               Applied on {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                         </div>
                         <div className="flex items-center gap-3">
                            {app.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleAppAction(app.id, "reject")}
                                  className="px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all border border-rose-100"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAppAction(app.id, "approve")}
                                  className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                  Approve Organizer
                                </button>
                              </>
                            )}
                            {app.status === 'APPROVED' && (
                              <button
                                onClick={() => fetchOrganizerDetails(app.organizerId)}
                                className="px-6 py-3 rounded-2xl bg-blue-50 text-primary font-black text-sm hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Edit Profile
                              </button>
                            )}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                         <div className="space-y-4">
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                                  <Globe size={18} />
                                </div>
                               <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Portfolio/Website</p>
                                  <a href={app.data?.portfolio} target="_blank" className="text-sm font-bold text-primary hover:underline">{app.data?.portfolio || "N/A"}</a>
                               </div>
                            </div>
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                                  <Briefcase size={18} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Experience</p>
                                  <p className="text-sm font-bold text-gray-700">{app.data?.experience || "N/A"}</p>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-start gap-4">
                               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                                  <FileText size={18} />
                               </div>
                               <div className="flex-1">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">References</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                     {app.data?.references?.map((ref: string, i: number) => (
                                       <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600">{ref}</span>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      {app.adminNotes && (
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <AlertCircle size={12} />
                              Admin Notes
                           </p>
                           <p className="text-sm text-gray-700 italic font-medium">{app.adminNotes}</p>
                        </div>
                      )}
                   </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Search size={48} />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">No applications found</h3>
                 <p className="text-gray-500 max-w-sm mx-auto">There are no organizer applications matching your current criteria.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Organizers Tab Listing Section */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, bio, website..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={orgStatusFilter}
                onChange={(e) => {
                  setOrgStatusFilter(e.target.value);
                  setOrgPage(1);
                }}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-sm text-gray-700 appearance-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="ESTABLISHED">ESTABLISHED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>

            {/* Verification Filter */}
            <div className="relative">
              <select
                value={orgVerificationFilter}
                onChange={(e) => {
                  setOrgVerificationFilter(e.target.value);
                  setOrgPage(1);
                }}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-sm text-gray-700 appearance-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ALL">All Verifications</option>
                <option value="true">Verified Badge Only</option>
                <option value="false">Unverified Only</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {loadingOrganizers ? (
            <div className="h-64 flex items-center justify-center"><CustomLoader /></div>
          ) : organizers.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100">
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Organizer Info</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status & Verification</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Finances & Commission</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-wider">Active Subscription</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {organizers.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50/30 transition-all">
                        <td className="p-6">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-gray-900 text-sm">{org.userProfile?.fullName || 'Organizer'}</h4>
                            <p className="text-xs text-gray-500 font-medium">{org.userProfile?.email || 'N/A'}</p>
                            {org.website && (
                              <a
                                href={org.website}
                                target="_blank"
                                className="text-[10px] text-primary font-bold hover:underline block truncate max-w-[200px]"
                              >
                                {org.website}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1.5 items-start">
                            <LocalStatusBadge status={org.status} />
                            {org.isVerified && (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified Badge
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-800">
                              Available: <span className="text-emerald-600">{formatCurrency(org.wallet?.availableBalance || 0)}</span>
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">
                              Rate: <span className="font-black text-primary">{org.commissionRate}%</span> | Staff Max: <span className="font-black">{org.maxStaff}</span>
                            </p>
                          </div>
                        </td>
                        <td className="p-6">
                          {org.activeSubscription ? (
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-gray-900">{org.activeSubscription.packageName}</p>
                              <p className="text-[10px] font-medium text-gray-400">Assigned: {new Date(org.activeSubscription.assignedAt).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">None</span>
                          )}
                        </td>
                        <td className="p-6 text-right">
                          <button
                            onClick={() => fetchOrganizerDetails(org.id)}
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {orgTotalPages > 1 && (
                <div className="p-6 bg-gray-50/40 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">
                    Showing {organizers.length} of {orgTotal} organizers
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrgPage(prev => Math.max(prev - 1, 1))}
                      disabled={orgPage === 1}
                      className="p-2 bg-white rounded-xl border border-gray-200 text-gray-400 hover:text-primary disabled:opacity-40 disabled:hover:text-gray-400 transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-black text-gray-700">
                      Page {orgPage} of {orgTotalPages}
                    </span>
                    <button
                      onClick={() => setOrgPage(prev => Math.min(prev + 1, orgTotalPages))}
                      disabled={orgPage === orgTotalPages}
                      className="p-2 bg-white rounded-xl border border-gray-200 text-gray-400 hover:text-primary disabled:opacity-40 disabled:hover:text-gray-400 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-sm">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Users size={40} />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-1">No organizers found</h3>
               <p className="text-gray-500 max-w-sm mx-auto text-xs">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      )}

      {/* Unified Manage/Edit Organizer Modal */}
      <ManageOrganizerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organizer={selectedOrganizer}
        onUpdate={() => {
          if (activeMainTab === 'applications') {
            fetchApplications();
          } else {
            fetchOrganizers();
          }
        }}
      />
    </div>
  );
};

export default UserManagementPage;
