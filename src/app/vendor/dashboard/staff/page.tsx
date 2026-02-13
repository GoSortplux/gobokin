'use client';

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import api from '@/services/api';
import { translateError } from '@/utils/errors';
import StaffModal from '@/components/vendor/StaffModal';
import { useUI } from '@/context/UIContext';
import withAuth from '@/components/auth/withAuth';
import Swal from "@/utils/sweetalert";
import CustomLoader from '@/components/CustomLoader';

interface Staff {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  hallIds?: string[];
}

const StaffContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);
  const { isStaffModalOpen, openStaffModal, closeStaffModal } = useUI();

  const handleOpenCreateModal = useCallback(() => {
    setEditingStaff(undefined);
    openStaffModal();
  }, [openStaffModal]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/my-staff');
      setStaff(response.data.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(translateError(err));
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleOpenCreateModal();

      // Clear the query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    }
  }, [searchParams, handleOpenCreateModal, pathname, router]);

  const handleAddStaff = async (formData: Record<string, unknown>) => {
    Swal.fire({
      title: 'Adding Staff Member...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.post('/users/add-staff', formData);
      await fetchStaff();
      closeStaffModal();
      Swal.fire({
        title: 'Success!',
        text: 'Staff member added successfully.',
        icon: 'success',
        confirmButtonColor: '#4F46E5',
      });
    } catch (error) {
      console.error('Failed to add staff:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to add staff member. Please try again.',
        icon: 'error',
        confirmButtonColor: '#4F46E5',
      });
    }
  };

  const handleUpdateStaff = async (formData: Record<string, unknown>) => {
    if (!editingStaff) return;

    Swal.fire({
      title: 'Updating Staff Member...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // API expects: fullName, phone, hallIds
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        hallIds: formData.hallIds,
      };

      await api.patch(`/users/staff/${editingStaff._id}`, payload);
      await fetchStaff();
      closeStaffModal();
      setEditingStaff(undefined);

      Swal.fire({
        title: 'Success!',
        text: 'Staff member updated successfully.',
        icon: 'success',
        confirmButtonColor: '#4F46E5',
      });
    } catch (error) {
      console.error('Failed to update staff:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update staff member. Please try again.',
        icon: 'error',
        confirmButtonColor: '#4F46E5',
      });
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove them!',
      cancelButtonText: 'No, cancel'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Removing...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await api.delete(`/users/remove-staff/${staffId}`);
        Swal.fire({
          title: 'Removed!',
          text: 'Staff member has been removed.',
          icon: 'success',
          confirmButtonColor: '#4F46E5',
        });
        fetchStaff();
      } catch (error) {
        console.error('Failed to remove staff:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to remove staff member. Please try again.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    }
  };


  const handleOpenEditModal = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    openStaffModal();
  };

  const filteredStaff = useMemo(() => {
    if (!searchTerm) return staff;
    return staff.filter(
      (member) =>
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Manage Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your team members and their access.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center"
        >
          Add Staff
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <CustomLoader size={40} className="mb-4" />
          <p className="text-gray-500 font-medium">Loading staff members...</p>
        </div>
      )}

      {error && <p className="text-red-600 mb-4 bg-red-50 p-4 rounded-lg border border-red-100">{error}</p>}

      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{member.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Staff"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(member._id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remove Staff"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      {!error && (searchTerm ? `No staff members found matching "${searchTerm}"` : "No staff members found. Add one to get started.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          closeStaffModal();
          setEditingStaff(undefined);
        }}
        onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}
        staff={editingStaff}
      />
    </div>
  );
};

const StaffPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <StaffContent />
  </Suspense>
);

export default withAuth(StaffPage, ['hall-owner']);
