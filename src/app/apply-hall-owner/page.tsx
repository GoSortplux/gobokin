'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import withAuth from '@/components/auth/withAuth';
import Swal from '@/utils/sweetalert';
import { ChevronRight, Home, Building2, MapPin, Users, CheckCircle2 } from 'lucide-react';
import PolicyModal from '@/components/PolicyModal';
import Link from 'next/link';
import CustomLoader from '@/components/CustomLoader';

interface Metadata {
  roles: string[];
  availabilityStatuses: string[];
  receivingBookingsTimeframes: string[];
  leadSources: string[];
  authorizationOptions: string[];
  onlineBookingPreferences: string[];
  hallsCountOptions: string[];
}

const ApplyHallOwnerPage = () => {
  const { user, updateToken, updateUserApplicationStatus, updateUser } = useAuth();
  const router = useRouter();
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [countries, setCountries] = useState<{ _id: string; name: string }[]>([]);
  const [states, setStates] = useState<{ _id: string; name: string }[]>([]);
  const [lgas, setLgas] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [formData, setFormData] = useState({
    hallName: '',
    country: '',
    state: '',
    localGovernment: '',
    hallAddress: '',
    capacity: '',
    role: '',
    roleOther: '',
    availability: '',
    receivingBookingsDate: '',
    howDidYouHear: '',
    howDidYouHearOther: '',
    isAuthorized: '',
    onlineBookingPreference: '',
    hallsCount: '',
  });

  useEffect(() => {
    if (user?.hasAcceptedHallOwnerPolicy) {
      setAcceptedPolicy(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metadataRes, countriesRes] = await Promise.all([
          api.get('/users/hall-owner-application/metadata'),
          api.get('/locations/countries'),
        ]);
        setMetadata(metadataRes.data.data);
        setCountries(countriesRes.data.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        Swal.toast.fire({
          icon: 'error',
          title: 'Failed to load form data. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.country) {
      const fetchStates = async () => {
        try {
          const response = await api.get(`/locations/states/${formData.country}`);
          setStates(response.data.data);
          // Clear state when country changes
          setFormData(prev => ({ ...prev, state: '', localGovernment: '' }));
        } catch (error) {
          console.error('Failed to fetch states:', error);
        }
      };
      fetchStates();
    } else {
      setStates([]);
      setFormData(prev => ({ ...prev, state: '', localGovernment: '' }));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state) {
      const fetchLgas = async () => {
        try {
          const response = await api.get(`/locations/lgas/${formData.state}`);
          setLgas(response.data.data);
          setFormData(prev => ({ ...prev, localGovernment: '' }));
        } catch (error) {
          console.error('Failed to fetch LGAs:', error);
        }
      };
      fetchLgas();
    } else {
      setLgas([]);
      setFormData(prev => ({ ...prev, localGovernment: '' }));
    }
  }, [formData.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const required = [
      'hallName', 'country', 'state', 'localGovernment', 'hallAddress', 'capacity',
      'role', 'availability', 'receivingBookingsDate', 'howDidYouHear',
      'isAuthorized', 'onlineBookingPreference', 'hallsCount'
    ];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        Swal.toast.fire({ icon: 'error', title: `Please fill in all required fields.` });
        return false;
      }
    }
    if (formData.role === 'Other' && !formData.roleOther) {
      Swal.toast.fire({ icon: 'error', title: 'Please specify your role.' });
      return false;
    }
    if (formData.howDidYouHear === 'Other' && !formData.howDidYouHearOther) {
      Swal.toast.fire({ icon: 'error', title: 'Please specify how you heard about us.' });
      return false;
    }
    if (!acceptedPolicy) {
      Swal.toast.fire({ icon: 'error', title: 'Please accept the Hall Owner Agreement.' });
      return false;
    }
    return true;
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        hallName: formData.hallName,
        country: formData.country,
        state: formData.state,
        localGovernment: formData.localGovernment,
        hallAddress: formData.hallAddress,
        capacity: Number(formData.capacity),
        role: formData.role,
        roleOther: formData.roleOther,
        availability: formData.availability,
        receivingBookingsDate: formData.receivingBookingsDate,
        howDidYouHear: formData.howDidYouHear,
        howDidYouHearOther: formData.howDidYouHearOther,
        isAuthorized: formData.isAuthorized,
        onlineBookingPreference: formData.onlineBookingPreference,
        hallsCount: formData.hallsCount,
        hasAcceptedHallOwnerPolicy: true,
      };

      // Conditionally include "Other" fields to avoid backend validation errors
      if (formData.role !== 'Other') {
        delete payload.roleOther;
      }
      if (formData.howDidYouHear !== 'Other') {
        delete payload.howDidYouHearOther;
      }

      await api.post('/users/apply-hall-owner', payload);

      // Refresh token to update user application status
      try {
        const refreshRes = await api.post('/auth/refresh-token');
        if (refreshRes.data?.data?.accessToken) {
          updateToken(refreshRes.data.data.accessToken);
        }
      } catch (_err) {
        // Fallback if refresh token fails
        updateUserApplicationStatus('pending');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Application Submitted!',
        text: 'Your application has been received and is being processed.',
        confirmButtonColor: '#295FA7',
      });
      router.push('/');
    } catch (error: unknown) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
            errorMessage = response.data.message;
        }
      }
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CustomLoader size={48} />
      </div>
    );
  }

  if (user?.hallOwnerApplication?.status === 'pending') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-4 uppercase italic">Application Pending</h1>
                <p className="text-gray-600 mb-8">
                    Your application to become a hall owner is currently being reviewed by our team.
                    We will notify you once a decision has been made.
                </p>
                <Link href="/" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-xl transition-all hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                <Building2 className="w-8 h-8 text-primary" />
            </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic">
            List your venue
          </h1>
          <p className="text-lg text-gray-600">
            Join our network of premium event spaces and reach thousands of customers.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleFinalSubmit} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="flex items-center text-xl font-bold text-gray-900 mb-6">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                  Venue Information
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hall Name</label>
                    <input
                      type="text"
                      name="hallName"
                      value={formData.hallName}
                      onChange={handleChange}
                      placeholder="e.g. Grand Royal Ballroom"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                        required
                      >
                        <option value="">Select Country</option>
                        {countries.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                        required
                        disabled={!formData.country}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Local Government Area</label>
                    <select
                      name="localGovernment"
                      value={formData.localGovernment}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                      required
                      disabled={!formData.state}
                    >
                      <option value="">Select Local Government Area</option>
                      {lgas.map((lga) => (
                        <option key={lga._id} value={lga._id}>{lga.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            name="hallAddress"
                            value={formData.hallAddress}
                            onChange={handleChange}
                            placeholder="Street address, City"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            required
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="capacity"
                                value={formData.capacity}
                                onChange={handleChange}
                                placeholder="Total capacity"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                required
                            />
                        </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">How many halls or venues do you manage or own?</label>
                    <select
                        name="hallsCount"
                        value={formData.hallsCount}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                        required
                    >
                        <option value="">Select Option</option>
                        {metadata?.hallsCountOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Your Role */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="flex items-center text-xl font-bold text-gray-900 mb-6">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                  Professional Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Position</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                      required
                    >
                      <option value="">Select Role</option>
                      {metadata?.roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  {formData.role === 'Other' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specify Role</label>
                      <input
                        type="text"
                        name="roleOther"
                        value={formData.roleOther}
                        onChange={handleChange}
                        placeholder="Please specify"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Are you authorized to list and manage bookings for this hall on Go Bokin?</label>
                  <select
                    name="isAuthorized"
                    value={formData.isAuthorized}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                    required
                  >
                    <option value="">Select Option</option>
                    {metadata?.authorizationOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Business Readiness */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="flex items-center text-xl font-bold text-gray-900 mb-6">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                  Business Readiness
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Is the hall currently available for booking?</label>
                        <select
                            name="availability"
                            value={formData.availability}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                            required
                        >
                            <option value="">Select Status</option>
                            {metadata?.availabilityStatuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">When would you like to start receiving bookings?</label>
                        <select
                            name="receivingBookingsDate"
                            value={formData.receivingBookingsDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                            required
                        >
                            <option value="">Select Timeframe</option>
                            {metadata?.receivingBookingsTimeframes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Are you open to allowing customers book and pay for this hall online via Go Bokin?</label>
                    <select
                      name="onlineBookingPreference"
                      value={formData.onlineBookingPreference}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                      required
                    >
                      <option value="">Select Preference</option>
                      {metadata?.onlineBookingPreferences.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Marketing */}
              <div className="pt-6 border-t border-gray-100">
                <h2 className="flex items-center text-xl font-bold text-gray-900 mb-6">
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                  Marketing
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">How did you hear about Go Bokin?</label>
                    <select
                      name="howDidYouHear"
                      value={formData.howDidYouHear}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                      required
                    >
                      <option value="">Select Option</option>
                      {metadata?.leadSources.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {formData.howDidYouHear === 'Other' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Specify Source</label>
                      <input
                        type="text"
                        name="howDidYouHearOther"
                        value={formData.howDidYouHearOther}
                        onChange={handleChange}
                        placeholder="Please specify"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10">
                <div className="flex items-start mb-6">
                  <div className="flex items-center h-5">
                    <input
                      id="policy-agreement"
                      name="policy-agreement"
                      type="checkbox"
                      checked={acceptedPolicy}
                      onChange={async (e) => {
                        const isChecked = e.target.checked;
                        setAcceptedPolicy(isChecked);
                        if (isChecked) {
                          try {
                            await api.patch('/users/me', { hasAcceptedHallOwnerPolicy: true });
                            updateUser({ hasAcceptedHallOwnerPolicy: true });
                          } catch (error) {
                            console.error('Failed to update policy acceptance:', error);
                          }
                        }
                      }}
                      className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="policy-agreement" className="font-medium text-gray-700 cursor-pointer">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setIsPolicyModalOpen(true)}
                        className="text-primary hover:underline font-bold"
                      >
                        Hall Owner Agreement
                      </button>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !acceptedPolicy}
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center text-lg uppercase italic tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Submit Application
                      <ChevronRight className="ml-2 w-6 h-6" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-4">
                    By submitting this application, you agree to our terms and conditions.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isPolicyModalOpen && (
        <PolicyModal
          type="hall-owner"
          slug="hall-owner-agreement"
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          onAccept={() => {
            setIsPolicyModalOpen(false);
            setAcceptedPolicy(true);
          }}
        />
      )}
    </div>
  );
};

export default withAuth(ApplyHallOwnerPage, ['user']);
