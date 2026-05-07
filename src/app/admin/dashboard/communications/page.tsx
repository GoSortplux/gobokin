"use client";
import React, { useState, useEffect } from "react";
import withAuth from "@/components/auth/withAuth";
import { AlertTriangle, Send, Plus, Calendar, User, Eye, Edit, Trash2, Mail, Users } from "lucide-react";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 animate-pulse rounded-lg" />
});
import 'react-quill-new/dist/quill.snow.css';

// --- Interfaces ---

interface Incident {
  _id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  shouldSendEmail: boolean;
  audience: string;
  targetRoles: string[];
  targetUsers: string[];
  customEmails: string[];
  fromEmail: string;
  fromName: string;
  createdAt: string;
}

interface Campaign {
  _id: string;
  subject: string;
  message: string;
  audience: string;
  targetRoles: string[];
  recipientCount: number;
  status: string;
  sentAt: string;
  createdAt: string;
}

// --- Components ---

const IncidentModal = ({
  incident,
  onClose,
  onSave
}: {
  incident?: Incident | null,
  onClose: () => void,
  onSave: () => void
}) => {
  const [loading, setLoading] = useState(false);
  const [, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: incident?.title || "",
    message: incident?.message || "",
    type: incident?.type || "incident",
    status: incident?.status || "investigating",
    shouldSendEmail: incident?.shouldSendEmail ?? false,
    audience: incident?.audience || "roles",
    targetRoles: incident?.targetRoles || ["user"],
    targetUsers: incident?.targetUsers || [],
    customEmails: incident?.customEmails || [],
    fromEmail: incident?.fromEmail || "status@gobokin.com",
    fromName: incident?.fromName || "Gobokin Status"
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/admin/incidents/categories");
        setCategories(res.data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (incident?._id) {
        await api.patch(`/admin/incidents/${incident._id}`, formData);
        Swal.fire("Success", "Incident updated successfully", "success");
      } else {
        await api.post("/admin/incidents", formData);
        Swal.fire("Success", "Incident created successfully", "success");
      }
      onSave();
    } catch (error) {
      console.error("Error saving incident:", error);
      Swal.fire("Error", "Could not save incident", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 uppercase italic flex items-center gap-2">
            <AlertTriangle className="text-amber-500" />
            {incident ? "Edit Incident Post" : "Create Incident Post"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
              >
                <option value="incident">Incident</option>
                <option value="maintenance">Maintenance</option>
                <option value="update">Update</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
            >
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Message</label>
            <div className="bg-white">
              <ReactQuill
                theme="snow"
                value={formData.message}
                onChange={(content) => setFormData({ ...formData, message: content })}
                className="h-40 mb-12"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-bold text-primary uppercase italic mb-3">Notification Settings</h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="shouldSendEmail"
                checked={formData.shouldSendEmail}
                onChange={(e) => setFormData({ ...formData, shouldSendEmail: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="shouldSendEmail" className="text-sm font-medium text-gray-700">Send Email Notification</label>
            </div>

            {formData.shouldSendEmail && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1 italic">From Name</label>
                    <input
                      type="text"
                      value={formData.fromName}
                      onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1 italic">From Email</label>
                    <input
                      type="email"
                      value={formData.fromEmail}
                      onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Audience</label>
                  <select
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                  >
                    <option value="roles">Specific Roles</option>
                    <option value="users">Specific Users</option>
                    <option value="custom">Custom Emails</option>
                    <option value="all">All Users</option>
                  </select>
                </div>

                {formData.audience === 'roles' && (
                  <div className="flex flex-wrap gap-2">
                    {['user', 'hall-owner', 'staff', 'super-admin'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          const roles = formData.targetRoles.includes(role)
                            ? formData.targetRoles.filter(r => r !== role)
                            : [...formData.targetRoles, role];
                          setFormData({ ...formData, targetRoles: roles });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase italic transition-all ${
                          formData.targetRoles.includes(role)
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : (incident ? "Update Post" : "Publish Post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CampaignModal = ({
  onClose,
  onSave
}: {
  onClose: () => void,
  onSave: () => void
}) => {
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    audience: "roles",
    targetRoles: ["user"],
    targetUsers: [] as string[],
    customEmails: [] as string[],
    fromName: "Gobokin",
    fromEmail: "hello@gobokin.com"
  });

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await api.post("/admin/email-campaigns/preview", {
        subject: formData.subject,
        message: formData.message,
      });
      setPreviewHtml(res.data.data.html);
      setShowPreview(true);
    } catch (error) {
      console.error("Error previewing campaign:", error);
      Swal.fire("Error", "Could not generate preview", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/email-campaigns/send", formData);
      Swal.fire("Success", "Email campaign sent successfully", "success");
      onSave();
    } catch (error) {
      console.error("Error sending campaign:", error);
      Swal.fire("Error", "Could not send campaign", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 border">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 uppercase italic flex items-center gap-2">
            <Mail className="text-primary" />
            New Email Campaign
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>

        <div className="flex h-[70vh]">
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar border-r">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Subject Line</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Content</label>
              <div className="bg-white">
                <ReactQuill
                  theme="snow"
                  value={formData.message}
                  onChange={(content) => setFormData({ ...formData, message: content })}
                  className="h-60 mb-12"
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-bold text-primary uppercase italic">Recipient Settings</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Audience</label>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                >
                  <option value="roles">Specific Roles</option>
                  <option value="all">All Users</option>
                </select>
              </div>

              {formData.audience === 'roles' && (
                <div className="flex flex-wrap gap-2">
                  {['user', 'hall-owner', 'staff', 'super-admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const roles = formData.targetRoles.includes(role)
                          ? formData.targetRoles.filter(r => r !== role)
                          : [...formData.targetRoles, role];
                        setFormData({ ...formData, targetRoles: roles });
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase italic transition-all ${
                        formData.targetRoles.includes(role)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 mt-6">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="flex-1 py-3 border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all uppercase"
              >
                {loading ? "..." : "Preview"}
              </button>
              <button
                type="submit"
                disabled={loading || !formData.message || !formData.subject}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Campaign"}
              </button>
            </div>
          </form>

          <div className="hidden lg:block w-1/3 bg-gray-50 overflow-y-auto p-4">
            {showPreview && previewHtml ? (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="mb-4 pb-2 border-b">
                  <p className="text-xs text-gray-400 uppercase font-bold italic">Email Preview</p>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <Eye size={48} className="mb-4 opacity-20" />
                <p className="text-sm italic">Click &quot;Preview&quot; to see how your email will look.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const IncidentsTab = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/incidents");
      setIncidents(res.data.data || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: "Delete Incident?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Yes, delete it"
    });

    if (res.isConfirmed) {
      try {
        await api.delete(`/admin/incidents/${id}`);
        Swal.fire("Deleted", "Incident post removed", "success");
        fetchIncidents();
      } catch (_error) {
        Swal.fire("Error", "Could not delete incident", "error");
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-800 uppercase italic">Incident Feed</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold uppercase italic shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 pl-8 space-y-8 py-4">
        {incidents.length > 0 ? incidents.map((incident) => (
          <div key={incident._id} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
              incident.status === 'resolved' ? 'bg-green-500' :
              incident.status === 'investigating' ? 'bg-amber-500' : 'bg-primary'
            }`} />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase italic ${
                      incident.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {incident.status}
                    </span>
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(incident.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase italic">{incident.title}</h3>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingIncident(incident); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(incident._id)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div
                className="text-gray-600 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: incident.message }}
              />
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase italic">
                    <User size={14} />
                    {incident.fromName}
                  </div>
                  {incident.shouldSendEmail && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase italic">
                      <Send size={14} />
                      Email Sent
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase italic">
                  ID: {incident._id.slice(-8)}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <AlertTriangle size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase italic">No incident reports yet</p>
          </div>
        )}
      </div>

      {(showModal || editingIncident) && (
        <IncidentModal
          incident={editingIncident}
          onClose={() => { setShowModal(false); setEditingIncident(null); }}
          onSave={() => { setShowModal(false); setEditingIncident(null); fetchIncidents(); }}
        />
      )}
    </div>
  );
};

const CampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/email-campaigns/history");
      setCampaigns(res.data.data || []);
    } catch (_error) {
      console.error("Error fetching campaigns:", _error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-800 uppercase italic">Campaign History</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold uppercase italic shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Send size={20} />
          Create Campaign
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase italic tracking-wider">Campaign</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase italic tracking-wider">Audience</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase italic tracking-wider">Recipients</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase italic tracking-wider">Date Sent</th>
              <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase italic tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.length > 0 ? campaigns.map((campaign) => (
              <tr key={campaign._id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 line-clamp-1 italic">{campaign.subject}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase italic">ID: {campaign._id.slice(-8)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {campaign.audience === 'roles' ? campaign.targetRoles.map(role => (
                      <span key={role} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase italic">
                        {role}
                      </span>
                    )) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase italic">
                        All Users
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-black text-gray-700 italic">
                    <Users size={14} className="text-gray-400" />
                    {campaign.recipientCount}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 font-bold italic">
                  {new Date(campaign.sentAt || campaign.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${
                    campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold italic uppercase">
                  No email campaigns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CampaignModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchCampaigns(); }}
        />
      )}
    </div>
  );
};

// --- Main Page ---

const CommunicationsPage = () => {
  const [activeTab, setActiveTab] = useState("incidents");

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight">Communications</h1>
          <p className="text-gray-500 font-bold uppercase italic text-xs mt-1">Manage system incidents and email campaigns</p>
        </div>
      </div>

      <div className="bg-white p-2 shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 min-h-[600px]">
        <div className="p-4 border-b border-gray-50 mb-6">
          <nav className="flex space-x-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("incidents")}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black uppercase italic transition-all ${
                activeTab === "incidents"
                  ? "bg-white text-primary shadow-lg shadow-gray-200 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <AlertTriangle size={18} />
              Incidents
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black uppercase italic transition-all ${
                activeTab === "campaigns"
                  ? "bg-white text-primary shadow-lg shadow-gray-200 scale-[1.02]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Send size={18} />
              Email Campaigns
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === "incidents" ? <IncidentsTab /> : <CampaignsTab />}
        </div>
      </div>
    </div>
  );
};

export default withAuth(CommunicationsPage, ["super-admin"]);
