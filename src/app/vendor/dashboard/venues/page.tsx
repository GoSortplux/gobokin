"use client";
import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useVendor } from "@/context/VendorContext";
import api from "@/services/api";
import { translateError } from "@/utils/errors";
import VenueModal from "@/components/vendor/VenueModal";
import ReservationModal from "@/components/vendor/ReservationModal";
import { useUI } from "@/context/UIContext";
import { ChevronDown, Edit, Power, PowerOff, Calendar } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";
import ErrorState from "@/components/ErrorState";
import Swal from "@/utils/sweetalert";

interface Venue {
  id: string;
  _id: string;
  name: string;
  location: string;
  capacity: number;
  isOnline: boolean;
  isOnlineBookingEnabled: boolean;
  price: number;
  demoBookings: number;
  views: number;
  pricing: {
    dailyRate?: number;
    hourlyRate?: number;
    blockRate?: number;
    blockDurationHours?: number;
  };
  geoLocation: {
    address: string;
  };
  hallSize: string;
  carParkCapacity: number;
  images: string[];
  videos?: string[];
}

const VenuesContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingVenue, setEditingVenue] = useState<Venue | undefined>(undefined);
  const { isVenueModalOpen, openVenueModal, closeVenueModal } = useUI();
  const { isLimitReached, subscription } = useVendor();
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [venueEvents, setVenueEvents] = useState<Record<string, any[]>>({});
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null);

  const pathname = usePathname();

  const handleOpenCreateModal = useCallback(() => {
    if (user?.activeRole !== "hall-owner") return;
    if (isLimitReached) {
      Swal.fire({
        title: 'Upgrade Required',
        text: `You have reached the maximum number of venues (${subscription?.tier.maxHalls}) for your current plan.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Upgrade Now',
        cancelButtonText: 'Later',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/vendor/dashboard/settings?tab=licenses');
        }
      });
    } else {
      setEditingVenue(undefined);
      openVenueModal();
    }
  }, [isLimitReached, subscription, router, openVenueModal, user?.activeRole]);

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get("/halls/by-owner");
      const venuesData = response.data.data;
      setVenues(venuesData);

      if (venuesData.length === 0 && user?.activeRole === 'hall-owner' && !sessionStorage.getItem('welcomePopupShown')) {
        Swal.fire({
          title: "Welcome!",
          text: "Let's get started by creating your first venue.",
          icon: "info",
          confirmButtonText: "Create Now",
          confirmButtonColor: "#295FA7",
        }).then((result) => {
          if (result.isConfirmed) {
            handleOpenCreateModal();
          }
        });
        sessionStorage.setItem('welcomePopupShown', 'true');
      }
    } catch (err: unknown) {
      console.error(err);
      setError(translateError(err));
      setVenues([]); // Ensure venues is an empty array on error
    } finally {
      setLoading(false);
    }
  }, [handleOpenCreateModal, user?.activeRole]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (searchParams.get('action') === 'create' && user?.activeRole === 'hall-owner') {
      handleOpenCreateModal();

      // Clear the query parameter without adding a new history entry
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      const newQuery = params.toString();
      router.replace(newQuery ? `${pathname}?${newQuery}` : pathname);
    }
  }, [searchParams, handleOpenCreateModal, pathname, router, user?.activeRole]);

  const handleCreate = async (formData: Record<string, unknown>) => {
    Swal.fire({
      title: 'Creating Venue...',
      text: 'Please wait while we set up your new venue.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await api.post('/halls', formData);
      Swal.toast.fire({
        icon: 'success',
        title: 'Venue Created!',
      });
      fetchVenues();
      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to create venue:', error);
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'Creation Failed. Please try again.',
      });
      throw error;
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!editingVenue) return;

    Swal.fire({
      title: 'Updating Venue...',
      text: 'Please wait while we save the changes.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.patch(`/halls/${editingVenue._id || editingVenue.id}`, formData);
      Swal.toast.fire({
        icon: 'success',
        title: 'Venue Updated!',
      });
      fetchVenues();
      closeVenueModal();
      setEditingVenue(undefined);
    } catch (error: unknown) {
      console.error('Failed to update venue:', error);
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'Update Failed. Please try again.',
      });
    }
  };

  const handleCreateReservation = async (reservationData: Record<string, unknown>) => {
    Swal.fire({
      title: 'Creating Reservation...',
      text: 'Please wait while we block the dates.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.post(`/halls/${reservationData.hallId}/reservations`, reservationData);
      setIsReservationModalOpen(false);
      Swal.toast.fire({
        icon: 'success',
        title: 'Reservation Created!',
      });
    } catch (error: unknown) {
      console.error('Failed to create reservation:', error);
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'Reservation Failed. Please try again.',
      });
    }
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    openVenueModal();
  };

  const openReservationModal = (hallId: string) => {
    setSelectedVenueId(hallId);
    setIsReservationModalOpen(true);
  };

  const handleToggleBooking = async (hallId: string, currentState: boolean) => {
    const action = currentState ? "disable" : "enable";
    const result = await Swal.fire({
      title: `Are you sure you want to ${action} online booking?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      confirmButtonColor: currentState ? '#e11d48' : '#059669',
    });

    if (result.isConfirmed) {
      try {
        await api.patch(`/halls/${hallId}/toggle-online-booking`);
        Swal.toast.fire({
          icon: 'success',
          title: `Online booking ${action}d successfully!`,
        });
        fetchVenues();
      } catch (error: unknown) {
        console.error(`Error toggling online booking:`, error);
        Swal.toast.fire({
          icon: 'error',
          title: `Could not ${action} online booking.`,
        });
      }
    }
  };

  const handleToggle = async (hallId: string) => {
    if (expandedVenueId === hallId) {
      setExpandedVenueId(null);
      return;
    }

    setExpandedVenueId(hallId);

    // Fetch events for this venue if not already fetched
    if (!venueEvents[hallId]) {
      try {
        setLoadingEvents(hallId);
        const response = await api.get(`/events/venue/${hallId}`);
        setVenueEvents(prev => ({ ...prev, [hallId]: response.data.data || [] }));
      } catch (error) {
        console.error("Failed to fetch venue events:", error);
        setVenueEvents(prev => ({ ...prev, [hallId]: [] }));
      } finally {
        setLoadingEvents(null);
      }
    }
  };

  const filteredVenues = useMemo(() => {
    if (!searchTerm) return venues;
    return venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.geoLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [venues, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Venues</h1>
        {user?.activeRole === "hall-owner" && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-colors flex items-center justify-center gap-3"
          >
            <span>Create Venue</span>
            {isLimitReached && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Limit Reached</span>}
          </button>
        )}
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-50 animate-pulse">
           <CustomLoader size={48} className="mb-4" />
           <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Synchronizing Venues...</p>
        </div>
      )}

      {error && (
        <ErrorState
            message={error}
            onRetry={fetchVenues}
            className="bg-white rounded-xl shadow-sm border border-gray-50 py-20"
        />
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white shadow-lg rounded-xl overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="sticky right-0 bg-gray-50 px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider z-20 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVenues.length > 0 ? (
                  filteredVenues.map((venue) => (
                    <React.Fragment key={venue.id}>
                      <tr className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 block">{venue.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{venue.hallSize || 'Standard Size'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-500 max-w-[200px] truncate" title={venue.location}>{venue.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">{venue.capacity}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-900">{venue.views || 0}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Views</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-900">{venue.demoBookings || 0}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Contact Attempts</p>
                                </div>
                            </div>
                        </td>
                        <td className="sticky right-0 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-right z-10 shadow-[-4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-end space-x-4">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleToggleBooking(venue._id || venue.id, venue.isOnlineBookingEnabled)}
                                className={`text-xs font-bold ${venue.isOnlineBookingEnabled ? 'text-rose-600 hover:text-rose-800 bg-rose-50' : 'text-emerald-600 hover:text-emerald-800 bg-emerald-50'} px-3 py-1.5 rounded-lg transition-colors border ${venue.isOnlineBookingEnabled ? 'border-rose-100' : 'border-emerald-100'} flex items-center gap-1.5`}
                                title={venue.isOnlineBookingEnabled ? "Disable Online Booking" : "Enable Online Booking"}
                              >
                                {venue.isOnlineBookingEnabled ? <PowerOff size={14} /> : <Power size={14} />}
                                <span>{venue.isOnlineBookingEnabled ? 'Disable' : 'Enable'}</span>
                              </button>
                              <button
                                onClick={() => openEditModal(venue)}
                                className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/10"
                                title="Edit Venue"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => openReservationModal(venue._id || venue.id)}
                                className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-amber-100"
                                title="Block Dates"
                              >
                                Block Dates
                              </button>
                            </div>
                            <button onClick={() => handleToggle(venue._id || venue.id)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors border-l border-gray-100 ml-2 pl-4">
                              <ChevronDown
                                size={18}
                                className={`transform transition-transform duration-300 ${
                                  expandedVenueId === (venue._id || venue.id) ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedVenueId === (venue._id || venue.id) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Pricing Strategy</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Daily</span>
                                        <span className="font-bold text-gray-900">₦{venue.pricing?.dailyRate?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span className="text-gray-500">Hourly</span>
                                        <span className="font-bold text-gray-900">₦{venue.pricing?.hourlyRate?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Parking</p>
                                <p className="text-sm font-bold text-gray-900">{venue.carParkCapacity ? `${venue.carParkCapacity} available spots` : 'No parking specified'}</p>
                              </div>
                              <div className="lg:col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Verified Address</p>
                                <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-md">{venue.geoLocation?.address || 'No specific address provided'}</p>
                              </div>
                              <div className="lg:col-span-4 border-t border-gray-200 pt-6 mt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                   <Calendar size={14} className="text-primary" />
                                   Events Scheduled at this Venue
                                </p>
                                {loadingEvents === (venue._id || venue.id) ? (
                                   <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                                      <CustomLoader size={16} />
                                      Loading events...
                                   </div>
                                ) : venueEvents[venue._id || venue.id]?.length > 0 ? (
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {venueEvents[venue._id || venue.id].map((event: any) => (
                                        <div key={event.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
                                           <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xs">
                                              {event.title[0]}
                                           </div>
                                           <div>
                                              <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{event.title}</p>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(event.startDate).toLocaleDateString()}
                                              </p>
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                                ) : (
                                   <p className="text-sm text-gray-400 font-medium italic">No public events currently scheduled at this venue.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                        {searchTerm ? `No results for "${searchTerm}"` : "No venues established"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredVenues.length > 0 ? (
              filteredVenues.map((venue) => (
                <div key={venue.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{venue.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{venue.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleBooking(venue._id || venue.id, venue.isOnlineBookingEnabled)}
                          className={`p-2 rounded-lg border ${venue.isOnlineBookingEnabled ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}
                          title={venue.isOnlineBookingEnabled ? "Disable Online Booking" : "Enable Online Booking"}
                        >
                          {venue.isOnlineBookingEnabled ? <PowerOff size={18} /> : <Power size={18} />}
                        </button>
                        <button
                          onClick={() => openEditModal(venue)}
                          className="p-2 text-primary bg-primary/5 rounded-lg border border-primary/10"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Capacity</p>
                        <p className="text-xs font-bold text-gray-900">{venue.capacity}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Views</p>
                        <p className="text-xs font-bold text-gray-900">{venue.views || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Contact Attempts</p>
                        <p className="text-xs font-bold text-gray-900">{venue.demoBookings || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(venue._id || venue.id)}
                          className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 py-2.5 rounded-lg"
                        >
                          {expandedVenueId === (venue._id || venue.id) ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => openReservationModal(venue._id || venue.id)}
                          className="px-4 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase border border-amber-100"
                        >
                          Block Dates
                        </button>
                    </div>
                  </div>

                  {expandedVenueId === (venue._id || venue.id) && (
                    <div className="bg-gray-50 px-4 py-5 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Rate</p>
                            <p className="text-xs font-bold text-gray-900">₦{venue.pricing?.dailyRate?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hourly Rate</p>
                            <p className="text-xs font-bold text-gray-900">₦{venue.pricing?.hourlyRate?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Detailed Address</p>
                        <p className="text-xs text-gray-600 font-medium">{venue.geoLocation?.address || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">
                 {searchTerm ? `No results for "${searchTerm}"` : "Establish your first venue"}
              </div>
            )}
          </div>
        </div>
      )}

      <VenueModal
        isOpen={isVenueModalOpen}
        onClose={() => {
          closeVenueModal();
          setEditingVenue(undefined);
        }}
        onSubmit={editingVenue ? handleUpdate : handleCreate}
        venue={editingVenue}
      />
      {isReservationModalOpen && selectedVenueId && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedVenueId(null);
          }}
          onSubmit={handleCreateReservation}
          hallId={selectedVenueId}
        />
      )}
    </div>
  );
};

const VenuesPage = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <CustomLoader size={48} />
    </div>
  }>
    <VenuesContent />
  </Suspense>
);

export default VenuesPage;
