"use client";
import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useVendor } from "@/context/VendorContext";
import api from "@/services/api";
import { translateError } from "@/utils/errors";
import HallModal from "@/components/vendor/HallModal";
import ReservationModal from "@/components/vendor/ReservationModal";
import { useUI } from "@/context/UIContext";
import { ChevronDown, Edit, Power, PowerOff } from "lucide-react";
import CustomLoader from "@/components/CustomLoader";
import ErrorState from "@/components/ErrorState";
import Swal from "@/utils/sweetalert";

interface Hall {
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
  };
  geoLocation: {
    address: string;
  };
  hallSize: string;
  carParkCapacity: number;
  images: string[];
  videos?: string[];
}

const HallsContent = () => {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingHall, setEditingHall] = useState<Hall | undefined>(undefined);
  const { isHallModalOpen, openHallModal, closeHallModal } = useUI();
  const { isLimitReached, subscription } = useVendor();
  const [expandedHallId, setExpandedHallId] = useState<string | null>(null);

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);

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
      setEditingHall(undefined);
      openHallModal();
    }
  }, [isLimitReached, subscription, router, openHallModal, user?.activeRole]);

  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get("/halls/by-owner");
      const hallsData = response.data.data;
      setHalls(hallsData);

      if (hallsData.length === 0 && user?.activeRole === 'hall-owner' && !sessionStorage.getItem('welcomePopupShown')) {
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
      setHalls([]); // Ensure halls is an empty array on error
    } finally {
      setLoading(false);
    }
  }, [handleOpenCreateModal, user?.activeRole]);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

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
      fetchHalls();
      return response.data.data;
    } catch (error: unknown) {
      console.error('Failed to create hall:', error);
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'Creation Failed. Please try again.',
      });
      throw error;
    }
  };

  const handleUpdate = async (formData: Record<string, unknown>) => {
    if (!editingHall) return;

    Swal.fire({
      title: 'Updating Venue...',
      text: 'Please wait while we save the changes.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await api.patch(`/halls/${editingHall._id || editingHall.id}`, formData);
      Swal.toast.fire({
        icon: 'success',
        title: 'Venue Updated!',
      });
      fetchHalls();
      closeHallModal();
      setEditingHall(undefined);
    } catch (error: unknown) {
      console.error('Failed to update hall:', error);
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

  const openEditModal = (hall: Hall) => {
    setEditingHall(hall);
    openHallModal();
  };

  const openReservationModal = (hallId: string) => {
    setSelectedHallId(hallId);
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
        fetchHalls();
      } catch (error: unknown) {
        console.error(`Error toggling online booking:`, error);
        Swal.toast.fire({
          icon: 'error',
          title: `Could not ${action} online booking.`,
        });
      }
    }
  };

  const handleToggle = (hallId: string) => {
    setExpandedHallId(expandedHallId === hallId ? null : hallId);
  };

  const filteredHalls = useMemo(() => {
    if (!searchTerm) return halls;
    return halls.filter(
      (hall) =>
        hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hall.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hall.geoLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [halls, searchTerm]);

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
            onRetry={fetchHalls}
            className="bg-white rounded-xl shadow-sm border border-gray-50 py-20"
        />
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHalls.length > 0 ? (
                  filteredHalls.map((hall) => (
                    <React.Fragment key={hall.id}>
                      <tr className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900 block">{hall.name}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{hall.hallSize || 'Standard Size'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{hall.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">{hall.capacity}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-900">{hall.views || 0}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Views</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-900">{hall.demoBookings || 0}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Demos</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleToggleBooking(hall._id || hall.id, hall.isOnlineBookingEnabled)}
                              className={`text-xs font-bold ${hall.isOnlineBookingEnabled ? 'text-rose-600 hover:text-rose-800 bg-rose-50' : 'text-emerald-600 hover:text-emerald-800 bg-emerald-50'} px-3 py-1.5 rounded-lg transition-colors border ${hall.isOnlineBookingEnabled ? 'border-rose-100' : 'border-emerald-100'} flex items-center gap-1.5`}
                              title={hall.isOnlineBookingEnabled ? "Disable Online Booking" : "Enable Online Booking"}
                            >
                              {hall.isOnlineBookingEnabled ? <PowerOff size={14} /> : <Power size={14} />}
                              <span>{hall.isOnlineBookingEnabled ? 'Disable' : 'Enable'}</span>
                            </button>
                            <button
                              onClick={() => openEditModal(hall)}
                              className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/10"
                              title="Edit Venue"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openReservationModal(hall._id || hall.id)}
                              className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-amber-100"
                              title="Block Dates"
                            >
                              Block Dates
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button onClick={() => handleToggle(hall._id || hall.id)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronDown
                              size={18}
                              className={`transform transition-transform duration-300 ${
                                expandedHallId === (hall._id || hall.id) ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                      {expandedHallId === (hall._id || hall.id) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Pricing Strategy</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Daily</span>
                                        <span className="font-bold text-gray-900">₦{hall.pricing?.dailyRate?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span className="text-gray-500">Hourly</span>
                                        <span className="font-bold text-gray-900">₦{hall.pricing?.hourlyRate?.toLocaleString() || 'N/A'}</span>
                                    </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Parking</p>
                                <p className="text-sm font-bold text-gray-900">{hall.carParkCapacity ? `${hall.carParkCapacity} available spots` : 'No parking specified'}</p>
                              </div>
                              <div className="lg:col-span-2">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Verified Address</p>
                                <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-md">{hall.geoLocation?.address || 'No specific address provided'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                        {searchTerm ? `No results for "${searchTerm}"` : "No venues established"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredHalls.length > 0 ? (
              filteredHalls.map((hall) => (
                <div key={hall.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{hall.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{hall.location}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleBooking(hall._id || hall.id, hall.isOnlineBookingEnabled)}
                          className={`p-2 rounded-lg border ${hall.isOnlineBookingEnabled ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}
                          title={hall.isOnlineBookingEnabled ? "Disable Online Booking" : "Enable Online Booking"}
                        >
                          {hall.isOnlineBookingEnabled ? <PowerOff size={18} /> : <Power size={18} />}
                        </button>
                        <button
                          onClick={() => openEditModal(hall)}
                          className="p-2 text-primary bg-primary/5 rounded-lg border border-primary/10"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Capacity</p>
                        <p className="text-xs font-bold text-gray-900">{hall.capacity}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Views</p>
                        <p className="text-xs font-bold text-gray-900">{hall.views || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Demos</p>
                        <p className="text-xs font-bold text-gray-900">{hall.demoBookings || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(hall._id || hall.id)}
                          className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 py-2.5 rounded-lg"
                        >
                          {expandedHallId === (hall._id || hall.id) ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => openReservationModal(hall._id || hall.id)}
                          className="px-4 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase border border-amber-100"
                        >
                          Block Dates
                        </button>
                    </div>
                  </div>

                  {expandedHallId === (hall._id || hall.id) && (
                    <div className="bg-gray-50 px-4 py-5 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Daily Rate</p>
                            <p className="text-xs font-bold text-gray-900">₦{hall.pricing?.dailyRate?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hourly Rate</p>
                            <p className="text-xs font-bold text-gray-900">₦{hall.pricing?.hourlyRate?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Detailed Address</p>
                        <p className="text-xs text-gray-600 font-medium">{hall.geoLocation?.address || 'N/A'}</p>
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

      <HallModal
        isOpen={isHallModalOpen}
        onClose={() => {
          closeHallModal();
          setEditingHall(undefined);
        }}
        onSubmit={editingHall ? handleUpdate : handleCreate}
        hall={editingHall}
      />
      {isReservationModalOpen && selectedHallId && (
        <ReservationModal
          isOpen={isReservationModalOpen}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedHallId(null);
          }}
          onSubmit={handleCreateReservation}
          hallId={selectedHallId}
        />
      )}
    </div>
  );
};

const HallsPage = () => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[400px]">
      <CustomLoader size={48} />
    </div>
  }>
    <HallsContent />
  </Suspense>
);

export default HallsPage;
