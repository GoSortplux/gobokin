'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { X } from 'lucide-react';
import CustomLoader from '../CustomLoader';

interface Venue {
  _id: string;
  name: string;
}

interface StaffMember {
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  venueIds?: string[];
}

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, unknown>) => void;
  staff?: StaffMember; // For editing existing staff
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, onSubmit, staff }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    venueIds: [] as string[],
  });
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  useEffect(() => {
    // Fetch all venues to populate the multi-select dropdown
    const fetchVenues = async () => {
      setVenuesLoading(true);
      try {
        const response = await api.get('/halls/by-owner');
        setAllVenues(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setVenuesLoading(false);
      }
    };
    if (isOpen) {
      fetchVenues();
    }
  }, [isOpen]);

  useEffect(() => {
    if (staff) {
      setFormData({
        fullName: staff.fullName || '',
        email: staff.email || '',
        phone: staff.phone || '',
        password: '', // Password should not be pre-filled
        venueIds: staff.venueIds || [],
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        venueIds: [],
      });
    }
  }, [staff, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVenue = (venueId: string) => {
    if (!venueId) return;
    setFormData((prev) => ({
      ...prev,
      venueIds: [...prev.venueIds, venueId],
    }));
  };

  const handleRemoveVenue = (venueId: string) => {
    setFormData((prev) => ({
      ...prev,
      venueIds: prev.venueIds.filter((id) => id !== venueId),
    }));
  };

  const unassignedVenues = allVenues.filter(
    (venue) => !formData.venueIds.includes(venue._id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Omit password if it's empty (for editing without changing password)
    // Map venueIds back to hallIds for API
    const { venueIds, ...rest } = formData;
    const dataToSubmit: Record<string, unknown> = {
        ...rest,
        hallIds: venueIds
    };

    if (!dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
            {staff ? (
              <>Edit <span className="text-primary not-italic">Staff</span></>
            ) : (
              <>Add <span className="text-primary not-italic">Staff</span></>
            )}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {staff ? 'Update staff member details and venue assignments.' : 'Create a new staff account to help manage your venues.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Full Name</label>
            <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Email Address</label>
            <input type="email" name="email" placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Phone Number</label>
            <input type="tel" name="phone" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Password</label>
            <input type="password" name="password" placeholder={staff ? 'Enter New Password (leave blank to keep current)' : 'Enter Password'} value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-800 flex justify-between items-center">
              Assign Venues
              {venuesLoading && <CustomLoader size={16} />}
            </label>

            {/* Pills Container */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-100 bg-gray-50/50 rounded-xl">
              {formData.venueIds.length > 0 ? (
                formData.venueIds.map((id) => {
                  const venue = allVenues.find((v) => v._id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                      <span className="text-xs font-bold text-gray-700">{venue?.name || 'Unknown Venue'}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVenue(id)}
                        className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                        aria-label={`Remove ${venue?.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs text-gray-400 py-1.5 px-1">No venues assigned yet.</span>
              )}
            </div>

            {/* Dropdown for adding new venues */}
            <select
              disabled={venuesLoading || unassignedVenues.length === 0}
              value=""
              onChange={(e) => handleAddVenue(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer"
            >
              <option value="" disabled>
                {unassignedVenues.length === 0 ? (allVenues.length > 0 ? 'All venues assigned' : 'No venues available') : 'Add a venue...'}
              </option>
              {unassignedVenues.map((venue) => (
                <option key={venue._id} value={venue._id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end mt-8 space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              {staff ? 'Save Changes' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;
