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

  const handleVenueSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, venueIds: selectedIds }));
  };

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
            <label className="block text-sm font-medium text-gray-800">Full Name</label>
            <input type="text" name="fullName" placeholder="Enter Full Name" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Email Address</label>
            <input type="email" name="email" placeholder="Enter Email Address" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Phone Number</label>
            <input type="tel" name="phone" placeholder="Enter Phone Number" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800">Password</label>
            <input type="password" name="password" placeholder={staff ? 'Enter New Password (leave blank to keep current)' : 'Enter Password'} value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500" />
          </div>
          <div>
            <label htmlFor="venueIds" className="block text-sm font-medium text-gray-800 flex justify-between">
              Assign Venues
              {venuesLoading && <CustomLoader size={16} />}
            </label>
            <select
              id="venueIds"
              name="venueIds"
              multiple
              disabled={venuesLoading}
              value={formData.venueIds}
              onChange={handleVenueSelection}
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-50 disabled:cursor-wait"
            >
              {allVenues.map((venue) => (
                <option key={venue._id} value={venue._id} className="text-gray-900">
                  {venue.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple venues.</p>
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
