
"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import { Search, Trash, Edit, X, Eye, Building2, Users, Info } from "lucide-react";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string[];
  phone?: string;
  whatsappNumber?: string;
  avatar?: string;
  commissionRate?: number;
}

interface VenueOwnerApplication {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    whatsappNumber?: string;
    avatar?: string;
  } | null;
  hallName: string;
  country: string | { _id: string; name: string };
  state: string | { _id: string; name: string };
  localGovernment?: string | { _id: string; name: string };
  hallAddress: string;
  capacity: number;
  role: string;
  roleOther?: string;
  availability: string;
  receivingBookingsDate: string;
  howDidYouHear: string;
  howDidYouHearOther?: string;
  isAuthorized: string;
  onlineBookingPreference: string;
  hallsCount: string;
  status: string;
  createdAt: string;
}

const USERS_PER_PAGE = 10;

const UserEditModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: () => void }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    whatsappNumber: user.whatsappNumber || "",
    avatar: user.avatar || "",
    commissionRate: user.commissionRate !== undefined ? String(user.commissionRate) : "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        commissionRate: formData.commissionRate === "" ? null : Number(formData.commissionRate)
      };
      await api.patch(`/users/${user._id}`, payload);
      Swal.fire("Success", "User updated successfully.", "success");
      onSave();
    } catch (error) {
      console.error("Error updating user:", error);
      Swal.fire("Error", "Could not update user.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full mx-auto max-w-lg overflow-hidden border">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 uppercase italic">Edit User Info</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">WhatsApp Number</label>
            <input
              type="text"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Avatar URL</label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          {user.role.includes('hall-owner') && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 italic">Custom Commission Rate (%)</label>
              <input
                type="number"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-gray-900"
                placeholder="Leave empty to use tier default"
                min="0"
                max="100"
                step="0.01"
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">Override the default platform commission for this specific hall owner.</p>
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplicationDetailsModal = ({
  application,
  onClose,
  onApprove,
  onReject
}: {
  application: VenueOwnerApplication;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}) => {
  if (!application) return null;

  const DetailItem = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="border-b border-gray-100 py-3">
      <p className="text-xs font-semibold text-gray-500 uppercase italic mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value || 'N/A'}</p>
    </div>
  );

  const getLocationName = (location: string | { name: string } | undefined) => {
    if (!location) return 'N/A';
    return typeof location === 'string' ? location : location.name;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full mx-auto max-w-2xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic leading-none">Application Details</h2>
              <p className="text-xs text-gray-500 font-bold mt-1 uppercase italic tracking-wider">Reviewing {application.user?.fullName || 'Anonymous'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <div className="col-span-full mb-4">
              <h3 className="text-sm font-black text-primary uppercase italic flex items-center gap-2 mb-4 border-b pb-2">
                <Info size={16} />
                Venue Information
              </h3>
            </div>
            <DetailItem label="Venue Name" value={application.hallName} />
            <DetailItem label="Capacity" value={application.capacity} />
            <DetailItem label="Country" value={getLocationName(application.country)} />
            <DetailItem label="State" value={getLocationName(application.state)} />
            <DetailItem label="Local Government" value={getLocationName(application.localGovernment)} />
            <DetailItem label="Address" value={application.hallAddress} />
            <DetailItem label="Managed Venues" value={application.hallsCount} />

            <div className="col-span-full mt-6 mb-4">
              <h3 className="text-sm font-black text-primary uppercase italic flex items-center gap-2 mb-4 border-b pb-2">
                <Users size={16} />
                Professional & Business
              </h3>
            </div>
            <DetailItem label="Your Role" value={application.role === 'Other' ? application.roleOther : application.role} />
            <DetailItem label="Authorized" value={application.isAuthorized} />
            <DetailItem label="Availability" value={application.availability} />
            <DetailItem label="Start Date" value={application.receivingBookingsDate} />
            <DetailItem label="Online Booking" value={application.onlineBookingPreference} />
            <DetailItem label="Lead Source" value={application.howDidYouHear === 'Other' ? application.howDidYouHearOther : application.howDidYouHear} />

            <div className="col-span-full mt-6 mb-4">
              <h3 className="text-sm font-black text-primary uppercase italic flex items-center gap-2 mb-4 border-b pb-2">
                <Info size={16} />
                User Information
              </h3>
            </div>
            <DetailItem label="Full Name" value={application.user?.fullName} />
            <DetailItem label="Email" value={application.user?.email} />
            <DetailItem label="Phone" value={application.user?.phone} />
            <DetailItem label="WhatsApp" value={application.user?.whatsappNumber} />
          </div>
        </div>

        {application.status === 'pending' && (
          <div className="p-6 bg-gray-50/50 border-t flex gap-4">
            <button
              onClick={() => application.user?._id && onReject(application.user._id)}
              className="flex-1 py-4 bg-white border-2 border-red-500 text-red-500 rounded-2xl font-black uppercase italic tracking-widest hover:bg-red-50 transition-all shadow-lg shadow-red-500/10"
            >
              Reject Application
            </button>
            <button
              onClick={() => application.user?._id && onApprove(application.user._id)}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              Approve Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AllUsersTab = () => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire("Error", "Could not fetch users.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users
      .filter((user) =>
        roleFilter ? user.role?.includes(roleFilter) : true
      )
      .filter(
        (user) =>
          (user.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the user's account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${userId}`);
        Swal.fire("Deleted!", "The user has been deleted.", "success");
        fetchUsers(); // Refresh data
      } catch (error) {
        console.error("Error deleting user:", error);
        Swal.fire("Error", "Could not delete the user.", "error");
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary w-full text-gray-900"
          />
        </div>
        <div className="w-full md:w-1/4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full p-2 border border-gray-300 rounded-md text-gray-900"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="hall-owner">Venue Owner</option>
            <option value="staff">Staff</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto shadow-sm border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roles</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role.join(", ")}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteUser(user._id)} className="text-red-600 hover:text-red-900">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50">
          Previous
        </button>
        <span className="text-sm text-gray-800">
          Page {currentPage} of {totalPages}
        </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50">
          Next
        </button>
      </div>
    </>
  );
};

const PendingApplicationsTab = () => {
  const [applications, setApplications] = useState<VenueOwnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<VenueOwnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/hall-owner-applications");
      setApplications(response.data.data.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      Swal.fire("Error", "Could not fetch pending applications.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (!Array.isArray(applications)) return [];
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);

  const handleApprove = async (userId: string) => {
    const result = await Swal.fire({
      title: "Approve Application?",
      text: "Are you sure you want to approve this venue owner application?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#295FA7",
      confirmButtonText: "Yes, approve it!",
    });

    if (result.isConfirmed) {
      setSelectedApp(null);
      Swal.fire({
        title: "Approving...",
        text: "Please wait while the application is being approved.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        await api.patch(`/admin/hall-owner-applications/${userId}/approve`);
        Swal.fire("Approved!", "The application has been approved.", "success");
        fetchApplications(); // Refresh data
      } catch (error) {
        console.error("Error approving application:", error);
        Swal.fire("Error", "Could not approve the application.", "error");
      }
    }
  };

  const handleReject = async (userId: string) => {
    const result = await Swal.fire({
      title: "Reject Application?",
      text: "Are you sure you want to reject this application? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, reject it!",
    });

    if (result.isConfirmed) {
      setSelectedApp(null);
      Swal.fire({
        title: "Rejecting...",
        text: "Please wait while the application is being rejected.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        await api.patch(`/admin/hall-owner-applications/${userId}/reject`);
        Swal.fire("Rejected!", "The application has been rejected.", "success");
        fetchApplications(); // Refresh data
      } catch (error) {
        console.error("Error rejecting application:", error);
        Swal.fire("Error", "Could not reject the application.", "error");
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Sub-tabs for status filtering */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-6 py-2 rounded-lg text-sm font-bold uppercase italic transition-all ${
              statusFilter === status
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto shadow-sm border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Venue Name</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{app.user?.fullName || 'Anonymous'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.hallName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl mr-2 transition-all"
                      title="View Details"
                    >
                      <Eye size={18} />
                      <span className="hidden sm:inline">Details</span>
                    </button>
                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => app.user?._id && handleApprove(app.user._id)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl mr-2 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => app.user?._id && handleReject(app.user._id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-800 font-medium italic">
                  No {statusFilter} applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

const DeletionRequestsTab = () => {
  const [requests, setRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/deletion-requests");
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching deletion requests:", error);
      Swal.fire("Error", "Could not fetch deletion requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will deactivate the account for deletion.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, approve it!",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Approving...",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        await api.patch(`/admin/deletion-requests/${userId}/approve`);
        Swal.fire("Approved!", "The deletion request has been approved.", "success");
        fetchRequests();
      } catch (error) {
        console.error("Error approving deletion request:", error);
        Swal.fire("Error", "Could not approve the deletion request.", "error");
      }
    }
  };

  const handleDecline = async (userId: string) => {
    const { value: reason } = await Swal.fire({
      title: "Decline Deletion Request",
      input: "textarea",
      inputLabel: "Reason for declining",
      inputPlaceholder: "Enter the reason here...",
      inputAttributes: {
        "aria-label": "Enter the reason here",
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
    });

    if (reason) {
      Swal.fire({
        title: "Declining...",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      try {
        await api.patch(`/admin/deletion-requests/${userId}/decline`, { reason });
        Swal.fire(
          "Declined!",
          "The deletion request has been declined.",
          "success"
        );
        fetchRequests();
      } catch (error) {
        console.error("Error declining deletion request:", error);
        Swal.fire("Error", "Could not decline the deletion request.", "error");
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="overflow-x-auto shadow-sm border rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roles</th>
            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {requests.length > 0 ? (
            requests.map((request) => (
              <tr key={request._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{request.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.role?.join(", ") || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleApprove(request._id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2">
                    Approve
                  </button>
                  <button onClick={() => handleDecline(request._id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                    Decline
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-800">
                No account deletion requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const UsersPageContent = () => {
  const [activeTab, setActiveTab] = useState("allUsers");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Users</h1>
      <div className="bg-white p-6 shadow-lg rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("allUsers")}
              className={`${
                activeTab === "allUsers"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Users
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`${
                activeTab === "pending"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Venue Owner Applications
            </button>
            <button
              onClick={() => setActiveTab("deletions")}
              className={`${
                activeTab === "deletions"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Deletion Requests
            </button>
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === "allUsers" && <AllUsersTab />}
          {activeTab === "pending" && <PendingApplicationsTab />}
          {activeTab === "deletions" && <DeletionRequestsTab />}
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <UsersPageContent />
  </Suspense>
);

export default withAuth(UsersPage, ["super-admin"]);
